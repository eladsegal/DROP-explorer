# [DROP Explorer](http://eladsegal.github.io/DROP-explorer)

This is a data explorer for the dataset [DROP: A Reading Comprehension Benchmark Requiring Discrete Reasoning Over Paragraphs](https://allennlp.org/drop).

#### Available for immediate use at http://eladsegal.github.io/DROP-explorer.  
- Dataset files are available [here](https://allennlp.org/drop).
- Prediction files examples are available [here](https://github.com/eladsegal/tag-based-multi-span-extraction/tree/master/predictions).  
For DROP, use the standardized dataset file [here](https://github.com/eladsegal/tag-based-multi-span-extraction/blob/master/drop_data/drop_dataset_dev_standardized.json) for correct alignment.  
For Quoref, use the DROPified dataset file [here](https://github.com/eladsegal/tag-based-multi-span-extraction/blob/master/quoref_data/quoref_dataset_dev.json).

![DROP Explorer screenshot](screenshot.png)

## Things to know

- Clicking on a question row will highlight a gold answer and the predicted answer.
- Multi-span answers are sorted
- The first answer displayed is the one in "answer", the rest are from "validated_answers" and only distinct answers are displayed. 
- Be aware that heads with some names are handled in a special way:
    - Predictions from "counting" head won't be highlighted
    - Predictions from "arithmetic" head are expected to have a member named "numbers" in "answer" which is an array.
    
## Expected Predictions File Format

The expected predictions file format is JSONL, where each line is a JSON object that is the `output_dict` of an instance prediction.
The following members will be used and are required unless mentioned otherwise (they don't have to be correct, but just have the correct type):
- passage_id: string
- query_id: string
- answer: A JSON object with the following members:
    - value: The final prediction - A string or an array of strings
    - spans (optional): An array of arrays of the form `["p" (passage) / "q" (question), start_index, end_index (exclusive)]` used to make spans that the model used for prediction bold.
    - numbers (required and used only when the head is "arithmetic"): An array of objects of the form `{"value": number, "sign": -1/0/-1}` to construct the arithmetic expression used to arrive at the answer
- predicted_ability: The name of the head used for prediction 
- maximizing_ground_truth: The answer for which the highest EM and F1 scores were calculated, in the same format of an answer in the dataset.
- em (optional): The EM score calculated, a number
- f1 (optional): The F1 score calculated, a number
- max_passage_length (optional): The length of the passage that was considered for the model prediction, used to show which parts of the passage were truncated
