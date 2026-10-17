import unittest
from unittest.mock import patch
from tools.tool_search import ToolSearchConfig, classify_tools


def schema(name):
    return {"type": "function", "function": {"name": name, "parameters": {"type": "object"}}}


class EagerToolTest(unittest.TestCase):
    def test_default_plugin_deferral_is_preserved(self):
        with patch("tools.tool_search._registry_toolset", return_value="example_plugin"):
            visible, deferred = classify_tools([schema("example_plugin_tool")])
        self.assertEqual(visible, [])
        self.assertEqual(len(deferred), 1)

    def test_only_selected_eager_name_becomes_visible(self):
        config = ToolSearchConfig.from_raw({"eager": ["gateway_restart"]})
        with patch("tools.tool_search._registry_toolset", return_value="example_plugin"):
            visible, deferred = classify_tools(
                [schema("gateway_restart"), schema("other_plugin_tool")],
                config.effective_defer_tools, config.eager_tools,
            )
        self.assertEqual([x["function"]["name"] for x in visible], ["gateway_restart"])
        self.assertEqual([x["function"]["name"] for x in deferred], ["other_plugin_tool"])

    def test_eager_setting_does_not_add_unselected_tools(self):
        visible, deferred = classify_tools([], eager_tools=frozenset({"gateway_restart"}))
        self.assertEqual(visible + deferred, [])
        self.assertEqual(ToolSearchConfig.from_raw({"eager": "invalid-scalar"}).eager_tools, frozenset())


if __name__ == "__main__":
    unittest.main()
