package expo.modules.providerserver

import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import fi.iki.elonen.NanoHTTPD
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit

private const val RESPONSE_TIMEOUT_SECONDS = 120L

private sealed interface StreamEvent {
  data class Chunk(val payload: ByteArray) : StreamEvent
  data object Complete : StreamEvent
}

private data class PreparedResponse(
  val statusCode: Int,
  val headers: Map<String, String>,
  val body: String,
  val stream: Boolean,
)

private class QueueBackedInputStream(
  private val events: LinkedBlockingQueue<StreamEvent>,
) : InputStream() {
  private var currentBuffer: ByteArray? = null
  private var currentIndex = 0
  private var completed = false

  override fun read(): Int {
    if (completed) {
      return -1
    }

    while (currentBuffer == null || currentIndex >= currentBuffer!!.size) {
      when (val event = events.take()) {
        is StreamEvent.Chunk -> {
          currentBuffer = event.payload
          currentIndex = 0
        }
        StreamEvent.Complete -> {
          completed = true
          return -1
        }
      }
    }

    val next = currentBuffer!![currentIndex].toInt() and 0xFF
    currentIndex += 1
    return next
  }
}

private class PendingExchange {
  val responseLatch = CountDownLatch(1)
  val streamQueue = LinkedBlockingQueue<StreamEvent>()
  @Volatile
  var preparedResponse: PreparedResponse? = null
}

private class ProviderBridgeServer(
  port: Int,
  private val onRequest: (Map<String, Any?>) -> PendingExchange,
) : NanoHTTPD(port) {
  override fun serve(session: IHTTPSession): Response {
    return try {
      if (session.method == Method.OPTIONS) {
        val response = newFixedLengthResponse(Response.Status.NO_CONTENT, "text/plain", "")
        applyCommonHeaders(response)
        response
      } else {
        val payload = mutableMapOf<String, Any?>(
          "body" to readBody(session),
          "clientAddress" to session.remoteIpAddress,
          "headers" to session.headers,
          "method" to session.method.name,
          "path" to session.uri,
          "query" to session.queryParameterString,
          "requestId" to UUID.randomUUID().toString(),
        )

        val exchange = onRequest(payload)
        if (!exchange.responseLatch.await(RESPONSE_TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
          val timeout = newFixedLengthResponse(
            status(504),
            "application/json; charset=utf-8",
            """{"error":{"message":"Provider bridge timed out waiting for JavaScript.","type":"timeout"}}"""
          )
          applyCommonHeaders(timeout)
          return timeout
        }

        val prepared = exchange.preparedResponse
          ?: return newFixedLengthResponse(
            status(500),
            "application/json; charset=utf-8",
            """{"error":{"message":"Provider bridge returned no response.","type":"bridge_error"}}"""
          ).also(::applyCommonHeaders)

        if (prepared.stream) {
          val response = newChunkedResponse(
            status(prepared.statusCode),
            prepared.headers["Content-Type"] ?: "text/event-stream; charset=utf-8",
            QueueBackedInputStream(exchange.streamQueue),
          )
          applyCommonHeaders(response)
          prepared.headers.forEach { (name, value) -> response.addHeader(name, value) }
          response
        } else {
          val bytes = prepared.body.toByteArray(Charsets.UTF_8)
          val response = newFixedLengthResponse(
            status(prepared.statusCode),
            prepared.headers["Content-Type"] ?: "application/json; charset=utf-8",
            ByteArrayInputStream(bytes),
            bytes.size.toLong(),
          )
          applyCommonHeaders(response)
          prepared.headers.forEach { (name, value) -> response.addHeader(name, value) }
          response
        }
      }
    } catch (error: Exception) {
      newFixedLengthResponse(
        status(500),
        "application/json; charset=utf-8",
        """{"error":{"message":"${error.message ?: "Unknown provider error."}","type":"internal_error"}}"""
      ).also(::applyCommonHeaders)
    }
  }

  private fun readBody(session: IHTTPSession): String {
    if (session.method == Method.GET || session.method == Method.DELETE) {
      return ""
    }

    val files = HashMap<String, String>()
    session.parseBody(files)
    return files["postData"] ?: ""
  }

  private fun applyCommonHeaders(response: Response) {
    response.addHeader("Access-Control-Allow-Headers", "Authorization, Content-Type")
    response.addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    response.addHeader("Access-Control-Allow-Origin", "*")
  }

  private fun status(statusCode: Int): Response.IStatus {
    return object : Response.IStatus {
      override fun getDescription(): String = "$statusCode"
      override fun getRequestStatus(): Int = statusCode
    }
  }
}

class ProviderServerModule : Module() {
  private val pendingExchanges = ConcurrentHashMap<String, PendingExchange>()
  private var server: ProviderBridgeServer? = null
  private var serverPort = 0

  override fun definition() = ModuleDefinition {
    Name("ProviderServer")

    Events("onRequest")

    Function("getPlatformSupport") {
      "full"
    }

    AsyncFunction("getStatus") {
      if (server != null) "online" else "offline"
    }

    AsyncFunction("start") { port: Int ->
      if (server != null && serverPort == port) {
        return@AsyncFunction mapOf("port" to serverPort, "status" to "online")
      }

      stopServer()

      val nextServer = ProviderBridgeServer(port) { payload ->
        val requestId = payload["requestId"] as String
        val exchange = PendingExchange()
        pendingExchanges[requestId] = exchange
        sendEvent("onRequest", payload)
        exchange
      }

      nextServer.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false)
      server = nextServer
      serverPort = port

      mapOf("port" to serverPort, "status" to "online")
    }

    AsyncFunction("stop") {
      stopServer()
    }

    AsyncFunction("respond") { requestId: String, statusCode: Int, headers: Map<String, String>, body: String ->
      val exchange = pendingExchanges.remove(requestId)
        ?: throw UnexpectedException("Unknown requestId: $requestId")

      exchange.preparedResponse = PreparedResponse(
        statusCode = statusCode,
        headers = headers,
        body = body,
        stream = false,
      )
      exchange.responseLatch.countDown()
    }

    AsyncFunction("respondError") { requestId: String, statusCode: Int, message: String ->
      val exchange = pendingExchanges.remove(requestId)
        ?: throw UnexpectedException("Unknown requestId: $requestId")

      exchange.preparedResponse = PreparedResponse(
        statusCode = statusCode,
        headers = mapOf("Content-Type" to "application/json; charset=utf-8"),
        body = """{"error":{"message":"$message","type":"provider_error"}}""",
        stream = false,
      )
      exchange.responseLatch.countDown()
    }

    AsyncFunction("respondStreamStart") { requestId: String, statusCode: Int, headers: Map<String, String> ->
      val exchange = pendingExchanges[requestId]
        ?: throw UnexpectedException("Unknown requestId: $requestId")

      exchange.preparedResponse = PreparedResponse(
        statusCode = statusCode,
        headers = headers,
        body = "",
        stream = true,
      )
      exchange.responseLatch.countDown()
    }

    AsyncFunction("respondStreamChunk") { requestId: String, chunk: String ->
      val exchange = pendingExchanges[requestId]
        ?: throw UnexpectedException("Unknown requestId: $requestId")

      exchange.streamQueue.put(StreamEvent.Chunk(chunk.toByteArray(Charsets.UTF_8)))
    }

    AsyncFunction("respondStreamComplete") { requestId: String ->
      val exchange = pendingExchanges.remove(requestId)
        ?: throw UnexpectedException("Unknown requestId: $requestId")

      exchange.streamQueue.put(StreamEvent.Complete)
    }

    OnDestroy {
      stopServer()
    }
  }

  private fun stopServer() {
    server?.stop()
    server = null
    serverPort = 0
    pendingExchanges.values.forEach { exchange ->
      exchange.preparedResponse = PreparedResponse(
        statusCode = 503,
        headers = mapOf("Content-Type" to "application/json; charset=utf-8"),
        body = """{"error":{"message":"Provider server stopped.","type":"server_stopped"}}""",
        stream = false,
      )
      exchange.responseLatch.countDown()
    }
    pendingExchanges.clear()
  }
}
