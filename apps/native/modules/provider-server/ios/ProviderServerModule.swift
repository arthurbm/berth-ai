import ExpoModulesCore

public class ProviderServerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ProviderServer")

    Events("onRequest")

    Function("getPlatformSupport") {
      return "experimental"
    }

    AsyncFunction("getStatus") {
      return "offline"
    }

    AsyncFunction("start") { (port: Int) -> [String: Any] in
      return [
        "port": port,
        "status": "error"
      ]
    }

    AsyncFunction("stop") {}

    AsyncFunction("respond") { (_: String, _: Int, _: [String: String], _: String) in }
    AsyncFunction("respondError") { (_: String, _: Int, _: String) in }
    AsyncFunction("respondStreamStart") { (_: String, _: Int, _: [String: String]) in }
    AsyncFunction("respondStreamChunk") { (_: String, _: String) in }
    AsyncFunction("respondStreamComplete") { (_: String) in }
  }
}
