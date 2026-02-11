package com.ghreddy.facultymate.vtopbridge

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class VtopBridgeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VtopBridge")

    AsyncFunction("vtopCall") { jsonInput: String ->
      return@AsyncFunction vtopCall(jsonInput)
    }
  }

  private external fun vtopCall(input: String): String

  companion object {
    init {
      System.loadLibrary("rust_lib_vitapmate")
    }
  }
}
