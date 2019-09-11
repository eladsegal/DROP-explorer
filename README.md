# DROP Explorer

This is a data explorer for the dataset of [DROP: A Reading Comprehension Benchmark Requiring Discrete Reasoning Over Paragraphs](https://allennlp.org/drop).

Available at http://eladsegal.github.io/DROP-explorer.

## Things to know

- Multi-span answers are sorted
- The first answer displayed is the one in "answer", the rest are from "validated_answers" and only distinct answers are displayed. 

## Expected Predictions File Format

The expected predictions file format is JSONL, where each line is a JSON object that is the `output_dict` of an instance prediction.
The following members will be used and are required unless mentioned otherwise (they don't have to be correct, but just have the correct type):
- passage_id: string
- query_id: string
- answer: A JSON object with the following members:
    - value: The final prediction - A string or an array of strings
    - spans (optional): An array of arrays of the form `["p"/"q", start_index, end_index (exclusive)]` used to highlight in the question (`"q"`) or passage (`"p"`) spans that the model focused on for prediction
    - numbers (required and used only when the head is "arithmetic"): An array of objects of the form `{"value": number, "sign": -1/0/-1}` to construct the arithmetic expression used to arrive at the answer
- predicted_ability: The name of the head used for prediction 
- maximizing_ground_truth: An array of strings that is the answer for which the highest F1 score was calculated
- em (optional): The EM score calculated, a number
- f1 (optional): The F1 score calculated, a number
- max_passage_length (optional): The length of the passage that was considered for the model prediction, used to show which parts of the passage were truncated

## Known Issues

- Be aware that currently there is code that treat some heads names in a special way:
    - Predictions from "counting" head won't be highlighted
    - Predictions from "arithmetic" head are expected to have a member named "numbers" in "answer" which is an array.
