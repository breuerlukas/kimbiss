package de.kimbiss.api.meal.estimate;

import org.json.JSONObject;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * The CLI must run without tools, so text in a photo cannot make it read the
 * container's secrets. The schema must ask for the packaging and the piece
 * count before any weight, or the model skips them.
 */
final class MealEstimatePromptTest {
  private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x01};

  private static String schema() {
    var command = MealEstimatePrompt.create(MealImage.create(JPEG), "de").command();
    return command.get(command.indexOf("--json-schema") + 1);
  }

  @Test
  void theCliRunsWithoutToolsOnOpus() {
    var command = MealEstimatePrompt.create(MealImage.create(JPEG), "de").command();
    Assertions.assertEquals("", command.get(command.indexOf("--tools") + 1));
    Assertions.assertEquals("claude-opus-5-5", command.get(command.indexOf("--model") + 1));
  }

  @Test
  void thePackagingAndThePiecesComeBeforeTheWeight() {
    var schema = schema();
    Assertions.assertTrue(schema.indexOf("visible_text") < schema.indexOf("items"));
    Assertions.assertTrue(schema.indexOf("\"count\"") < schema.indexOf("\"grams\""));
    Assertions.assertTrue(schema.indexOf("piece_grams") < schema.indexOf("\"grams\""));
    Assertions.assertTrue(new JSONObject(schema).getJSONArray("required").toList()
      .contains("visible_text"));
  }
}
