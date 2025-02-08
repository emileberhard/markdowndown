Extract structured data using function calling
==============================================

[Skip to main content](#main-content)

*   [Models](https://ai.google.dev/gemini-api/docs)
    *   [Gemini API docs](https://ai.google.dev/gemini-api/docs)
    *   [API Reference](https://ai.google.dev/api)
    *   [SDKs](https://ai.google.dev/gemini-api/docs/sdks)
    *   [Pricing](https://ai.google.dev/pricing)
    *   [Cookbook](https://github.com/google-gemini/cookbook)
*   Solutions
*   Code assistance
*   Showcase
*   Community

*   [Overview](https://ai.google.dev/gemini-api/docs)
*   Get started
    
*   [Quickstart](https://ai.google.dev/gemini-api/docs/quickstart)
*   [API keys](https://ai.google.dev/gemini-api/docs/api-key)

*   [Pricing](https://ai.google.dev/gemini-api/docs/pricing)
*   [Release notes](https://ai.google.dev/gemini-api/docs/changelog)
*   [Developer forum](https://discuss.ai.google.dev/c/gemini-api/)
*   Models
    
*   [Gemini](https://ai.google.dev/gemini-api/docs/models/gemini)
*   [Experimental models](https://ai.google.dev/gemini-api/docs/models/experimental-models)
*   Capabilities
    
*   [Text generation](https://ai.google.dev/gemini-api/docs/text-generation)
*   [Vision](https://ai.google.dev/gemini-api/docs/vision)
*   [Audio understanding](https://ai.google.dev/gemini-api/docs/audio)
*   [Long context](https://ai.google.dev/gemini-api/docs/long-context)
*   [Code execution](https://ai.google.dev/gemini-api/docs/code-execution)
*   [Structured output](https://ai.google.dev/gemini-api/docs/structured-output)
*   [Thinking](https://ai.google.dev/gemini-api/docs/thinking)
*   [Multimodal Live API](https://ai.google.dev/api/multimodal-live)

*   [Document understanding](https://ai.google.dev/gemini-api/docs/document-processing)

*   [Embeddings](https://ai.google.dev/gemini-api/docs/embeddings)
*   Guides
    
*   [Multimodal Live API](https://ai.google.dev/gemini-api/docs/multimodal-live)
*   [Context caching](https://ai.google.dev/gemini-api/docs/caching)

*   [Token counting](https://ai.google.dev/gemini-api/docs/tokens)
*   [OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai)
*   [Billing info](https://ai.google.dev/gemini-api/docs/billing)

*   Gemini for Research
    
*   [Gemini Academic Program](https://ai.google.dev/gemini-api/docs/gemini-for-research)
*   Use cases
    
*   Applications
    
    *   [Chat application](https://ai.google.dev/gemini-api/tutorials/web-app)
    *   [Code assistant](https://ai.google.dev/gemini-api/tutorials/pipet-code-agent)
    *   [Flutter code generator](https://ai.google.dev/gemini-api/tutorials/flutter-theme-agent)
    *   [Content search](https://ai.google.dev/gemini-api/tutorials/docs-agent)
    *   [Data exploration agent](https://ai.google.dev/gemini-api/tutorials/sql-talk)
    *   [Writing assistant](https://ai.google.dev/gemini-api/tutorials/wordcraft)
    *   [Slides reviewer](https://ai.google.dev/gemini-api/tutorials/slides-advisor)
    
*   Troubleshooting
    
*   [API troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting)
*   [AI Studio troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshoot-ai-studio)
*   [Google Workspace](https://ai.google.dev/gemini-api/docs/workspace)
*   [Request more quota](https://ai.google.dev/gemini-api/docs/quota)
*   Legal
    
*   [Terms of service](https://ai.google.dev/gemini-api/terms)
*   [Available regions](https://ai.google.dev/gemini-api/docs/available-regions)
*   [Abuse monitoring](https://ai.google.dev/gemini-api/docs/abuse-monitoring)

*   On this page
*   [Setup](#setup)
*   [The example task](#the_example_task)
*   [Using Natural language](#using_natural_language)
*   [Use function calling](#use_function_calling)
    *   [Define the schema](#define_the_schema)
    *   [Call the API](#call_the_api)
*   [Conclusion](#conclusion)

In this tutorial you'll work through a structured data extraction example, using the Gemini API to extract the lists of characters, relationships, things, and places from a story.

Setup
-----

    pip install -U -q google-generativeai

import json
    import textwrap
    
    from google import genai
    from google.genai import types
    
    from IPython.display import JSON
    from IPython.display import display
    from IPython.display import Markdown
    
    
    def to_markdown(text):
      text = text.replace('•', '  *')
      return Markdown(textwrap.indent(text, '> ', predicate=lambda _: True))

Once you have the API key, pass it to the SDK. You can do this in two ways:

*   Put the key in the `GOOGLE_API_KEY` environment variable (the SDK will automatically pick it up from there).
*   Pass the key to `genai.Client(api_key=...)`

client = genai.Client(api_key=GOOGLE_API_KEY)

The example task
----------------

For this tutorial you'll extract entities from natural language stories. As an example, below is a story written by Gemini.

MODEL_ID="gemini-2.0-flash"
    prompt = """
    Write a long story about a girl with magic backpack, her family, and at
    least one other character. Make sure everyone has names. Don't forget to
    describe the contents of the backpack, and where everyone and everything
    starts and ends up.
    """
    
    response = client.models.generate_content(
      model=MODEL_ID,
      contents=prompt,    
    )
    story = response.text
to_markdown(story)

> Elara was a wisp of a girl, all elbows and knees, with eyes the color of a stormy sea. She lived in the quiet town of Havenwood, nestled beside a whispering forest that everyone else ignored. Elara, however, heard its secrets. She was the only one who knew, for instance, that Mrs. Gable’s prize-winning roses were whispered gossip by the oak trees, or that the creek gurgled out old children’s songs.
> 
> Elara’s most prized possession wasn't a listening ear, though. It was a simple, worn, leather backpack she’d found tucked away in the attic of her family’s old, creaky house. It looked ordinary enough, but it was anything but. This was no ordinary backpack, this was Elara's magic backpack.
> 
> Inside, the backpack held wonders. Not jewels or gold, but things far more useful. There was a bottomless jar of honey that never emptied, perfect for soothing sore throats or making tea. A small, intricately carved wooden bird that, when released, could fly messages faster than the wind. A handful of shimmering, iridescent dust that could mend anything broken, from cracked pottery to hurt feelings. A compass that pointed not north, but towards what she needed most. And, her favorite, a small, leather-bound book filled with blank pages that would fill with the perfect story, poem, or spell whenever she needed one.
> 
> Her parents, Arthur, a quiet carpenter with sawdust permanently clinging to his eyebrows, and Clara, a baker whose cinnamon rolls were legendary, knew about the backpack. They didn’t quite understand its magic, dismissing it as Elara's overactive imagination, but they loved her fiercely and tolerated the strange occurrences that sometimes followed her. They were good, steady people, content with their lives in Havenwood.
> 
> One day, a new face arrived in Havenwood. A gruff, barrel-chested man named Silas, with eyes that held a glint of steel and a perpetual scowl etched onto his face. He bought the dilapidated old mill on the edge of town, a place everyone else avoided, claiming he wanted to restore it. But Elara felt a prickle of unease whenever he was near. The forest, usually a source of comfort, seemed to murmur warnings when Silas walked past.
> 
> The first sign of trouble came when Clara’s cinnamon rolls started tasting…off. Bland, almost tasteless. Then Arthur’s woodworking projects began to crack and splinter, no matter how careful he was. The town, once vibrant and full of life, seemed to be losing its color, its joy.
> 
> Elara knew, with a certainty that resonated deep in her bones, that Silas was the cause. She had seen him late one night, creeping towards the Whispering Woods, muttering strange incantations under the sickly glow of the moon. He was draining the magic from Havenwood, bit by bit.
> 
> Determined to stop him, Elara turned to her backpack. She pulled out the compass. It spun wildly at first, confused, then settled, pointing not towards Silas directly, but towards the Whispering Woods. That was where she needed to go.
> 
> Knowing she couldn't face Silas alone, Elara confided in Thomas, the town’s librarian. He was a kind, bookish man, often lost in the pages of ancient tomes. He initially dismissed her concerns as fantasy, but the desperation in her voice, the genuine fear in her eyes, convinced him to listen.
> 
> Together, Elara and Thomas ventured into the Whispering Woods. The forest was different now, darker, quieter, the whispers almost hushed to silence. The air felt heavy, suffocating.
> 
> Guided by the compass, they followed a winding path to a clearing where Silas stood before a twisted, gnarled oak. He was chanting, his voice a harsh, grating rasp, and around him, the air shimmered with stolen magic.
> 
> “You can’t do this, Silas!” Elara called out, her voice trembling but firm.
> 
> Silas turned, his eyes widening in surprise. “What’s this? A couple of meddling children? You have no idea what I'm doing. I'm freeing this town from its useless magic! It makes you weak, dependent!”
> 
> “It makes us who we are!” Elara retorted, stepping forward. She reached into her backpack and pulled out the book. As she held it, the blank pages began to fill with words, weaving a tale of courage, resilience, and the power of community. It was a counter-spell, designed to restore the magic Silas was stealing.
> 
> Silas lunged forward, trying to snatch the book, but Thomas, surprisingly agile for a librarian, stepped in his path. He might not have magic, but he had a lifetime of knowledge and a fierce protectiveness towards Havenwood.
> 
> Elara began to read. Her voice, clear and strong, filled the clearing. As she read, the stolen magic began to flow back into the forest, into the town. The trees straightened, the air lightened, and the whispers returned, louder and more vibrant than before.
> 
> Silas screamed, his face contorted with rage. The gnarled oak he was standing before began to crack and crumble, its stolen magic returning to its source.
> 
> The book finished its tale, its pages returning to blankness. Silas collapsed, his power gone. He shrunk, both physically and spiritually, no longer the imposing figure that had terrorized Havenwood. He was just a small, bitter man, driven by resentment.
> 
> He was eventually driven out of town, promising revenge that never came.
> 
> Havenwood slowly returned to normal. Clara’s cinnamon rolls tasted sweeter than ever, Arthur’s woodworking was stronger and more beautiful, and the town buzzed with renewed energy.
> 
> Elara, however, was changed. She was no longer just a wisp of a girl. She was a protector, a guardian of Havenwood. She continued to carry her magic backpack, exploring the forest, listening to its secrets, and always ready to defend her home.
> 
> Thomas, inspired by his adventure, started a community garden, using his newfound knowledge of plants and herbs to bring beauty and healing to the town. He became a silent hero, not seeking praise, but finding satisfaction in helping others.
> 
> Elara's parents, though still a little bewildered by the whole ordeal, understood the importance of her magic and the role it played in their lives. Arthur even built a special shelf for her backpack, right beside the fireplace, a symbol of its importance to the family.
> 
> And so, Elara and her magic backpack remained in Havenwood, a silent guardian, always listening, always protecting, her life intertwined with the whispers of the forest and the love of her family and friends. She had saved her home, not with brute force, but with kindness, courage, and the enduring power of a magical backpack.

Using Natural language
----------------------

Large language models are a powerfuls multitask tools. Often you can just ask Gemini for what you want, and it will do okay.

The Gemini API doesn't have a JSON mode, so there are a few things to watch for when generating data structures this way:

*   Sometimes parsing fails.
*   The schema can't be strictly enforced.

You'll solve those problems in the next section. First, try a simple natural language prompt with the schema written out as text. This has not been optimized:

MODEL_ID="gemini-2.0-flash"
    prompt = """
    Please return JSON describing the people, places, things and relationships from this story using the following schema:
    
    {"people": list[PERSON], "places":list[PLACE], "things":list[THING], "relationships": list[RELATIONSHIP]}
    
    PERSON = {"name": str, "description": str, "start_place_name": str, "end_place_name": str}
    PLACE = {"name": str, "description": str}
    THING = {"name": str, "description": str, "start_place_name": str, "end_place_name": str}
    RELATIONSHIP = {"person_1_name": str, "person_2_name": str, "relationship": str}
    
    All fields are required.
    
    Important: Only return a single piece of valid JSON text.
    
    Here is the story:
    
    """ + story
    
    response = client.models.generate_content(
      model=MODEL_ID,
      contents=prompt,
      config=types.GenerateContentConfig(
        response_mime_type="application/json"
      ),
    )

That returned a json string. Try parsing it:

import json
    
    print(json.dumps(json.loads(response.text), indent=4))
{
        "people": [
            {
                "name": "Elara",
                "description": "A wisp of a girl with eyes the color of a stormy sea, who can hear the forest's secrets.",
                "start_place_name": "Havenwood",
                "end_place_name": "Havenwood"
            },
            {
                "name": "Arthur",
                "description": "Elara's father, a quiet carpenter with sawdust permanently clinging to his eyebrows.",
                "start_place_name": "Havenwood",
                "end_place_name": "Havenwood"
            },
            {
                "name": "Clara",
                "description": "Elara's mother, a baker whose cinnamon rolls were legendary.",
                "start_place_name": "Havenwood",
                "end_place_name": "Havenwood"
            },
            {
                "name": "Silas",
                "description": "A gruff, barrel-chested man with a glint of steel in his eyes who wanted to drain the magic from Havenwood.",
                "start_place_name": "Havenwood",
                "end_place_name": "Havenwood"
            },
            {
                "name": "Thomas",
                "description": "The town\u2019s librarian, a kind, bookish man.",
                "start_place_name": "Havenwood",
                "end_place_name": "Havenwood"
            }
        ],
        "places": [
            {
                "name": "Havenwood",
                "description": "A quiet town nestled beside a whispering forest."
            },
            {
                "name": "Whispering Woods",
                "description": "A forest beside Havenwood that murmurs secrets."
            },
            {
                "name": "Old Mill",
                "description": "A dilapidated old mill on the edge of Havenwood."
            }
        ],
        "things": [
            {
                "name": "Magic Backpack",
                "description": "A simple, worn, leather backpack that holds magical items.",
                "start_place_name": "Elara's House",
                "end_place_name": "Havenwood"
            },
            {
                "name": "Honey Jar",
                "description": "A bottomless jar of honey.",
                "start_place_name": "Magic Backpack",
                "end_place_name": "Magic Backpack"
            },
            {
                "name": "Wooden Bird",
                "description": "A small, intricately carved wooden bird that can fly messages.",
                "start_place_name": "Magic Backpack",
                "end_place_name": "Magic Backpack"
            },
            {
                "name": "Iridescent Dust",
                "description": "Shimmering dust that can mend anything broken.",
                "start_place_name": "Magic Backpack",
                "end_place_name": "Magic Backpack"
            },
            {
                "name": "Compass",
                "description": "A compass that points towards what is needed most.",
                "start_place_name": "Magic Backpack",
                "end_place_name": "Magic Backpack"
            },
            {
                "name": "Leather-bound Book",
                "description": "A small, leather-bound book filled with blank pages that fill with the perfect story, poem, or spell whenever needed.",
                "start_place_name": "Magic Backpack",
                "end_place_name": "Magic Backpack"
            },
            {
                "name": "Cinnamon Rolls",
                "description": "Legendary cinnamon rolls made by Clara.",
                "start_place_name": "Havenwood",
                "end_place_name": "Havenwood"
            }
        ],
        "relationships": [
            {
                "person_1_name": "Elara",
                "person_2_name": "Arthur",
                "relationship": "Daughter-Father"
            },
            {
                "person_1_name": "Elara",
                "person_2_name": "Clara",
                "relationship": "Daughter-Mother"
            },
            {
                "person_1_name": "Elara",
                "person_2_name": "Thomas",
                "relationship": "Friends"
            },
            {
                "person_1_name": "Elara",
                "person_2_name": "Silas",
                "relationship": "Adversaries"
            },
            {
                "person_1_name": "Arthur",
                "person_2_name": "Clara",
                "relationship": "Spouses"
            }
        ]
    }

That's relatively simple and often works, but you can potentially make this more strict/robust by defining the schema using the API's function calling feature.

Use function calling
--------------------

If you haven't gone through the [Function calling basics](https://ai.google.dev/tutorials/function_calling_python_quickstart) tutorial yet, make sure you do that first.

With function calling your function and its parameters are described to the API as a `genai.protos.FunctionDeclaration`. In basic cases the SDK can build the `FunctionDeclaration` from the function and its annotations. So you'll need to define them explicitly, for now.

### Define the schema

Start by defining `person` as an object with string fields `name`, `description`, `start_place_name`, `end_place_name`.

Person = {
        
        "type": "OBJECT",
        "properties": {
            "character_name": {
                "type": "STRING",
                "description": "Character name",
            },
            "character_description": {
                "type": "STRING",
                "description": "Character description",
            }
        },
        "required": ["character_name", "character_description"]
    }

Then do the same for each of the entities you're trying to extract:

Relationships = {
        "type": "OBJECT",
        "properties": {
            "first_character": {
                "type": "STRING",
                "description": "First character name",
            },
            "second_character": {
                "type": "STRING",
                "description": "Second character name",
            },
            "relationship": {
                "type": "STRING",
                "description": "Familiar elationship between first and second character",
            }
        },
        "required": ["first_character", "second_character", "relationship"]
    }
Places = {
        "type": "OBJECT",
        "properties": {
            "place_name": {
                "type": "STRING",
                "description": "Place name",
            },
            "place_description": {
                "type": "STRING",
                "description": "Place description",
            }
        },
        "required": ["place_name", "place_description"]
    }
Things = {
        "type": "OBJECT",
        "properties": {
            "thing_name": {
                "type": "STRING",
                "description": "Thing name",
            },
            "thing_description": {
                "type": "STRING",
                "description": "Thing description",
            }
        },
        "required": ["thing_name", "thing_description"]
    }

Now build the `FunctionDeclaration`:

get_people = types.FunctionDeclaration(
        name="get_people",
        description="Get information about characters",
        parameters=Person,
    )
    
    get_relationships = types.FunctionDeclaration(
        name="get_relationships",
        description="Get information about relationships between people",
        parameters=Relationships
    )
    
    get_places = types.FunctionDeclaration(
        name="get_places",
        description="Get information about places",
        parameters=Places
    )
    
    get_things = types.FunctionDeclaration(
        name="get_things",
        description="Get information about things",
        parameters=Things
    )
    
    story_tools = types.Tool(
        function_declarations=[get_people, get_relationships, get_places, get_things],
    )

### Call the API

Like you saw in [Function calling basics](https://ai.google.dev/tutorials/function_calling_python_quickstart) now you can pass this `FunctionDeclaration` to the `tools` argument of the `genai.GenerativeModel` constructor (the constructor would also accept an equivalent JSON representation of the function declaration):

MODEL_ID="gemini-2.0-flash"
    prompt = f"""
    {story}
    
    Please add the people, places, things, and relationships from this story to the database
    """
    
    result = client.models.generate_content(
        model=MODEL_ID,
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=[story_tools],
            temperature=0
            )
    )

Now there is no text to parse. The result _is_ a datastructure.

print(result.candidates[0].content.parts[0].text)
None
result.candidates[0].content.parts[0].function_call
FunctionCall(id=None, args={'character_name': 'Elara', 'character_description': 'a wisp of a girl, all elbows and knees, with eyes the color of a stormy sea'}, name='get_people')
fc = result.candidates[0].content.parts[0].function_call
    print(type(fc))
<class 'google.genai.types.FunctionCall'>

The `genai.protos.FunctionCall` class is based on Google Protocol Buffers, convert it to a more familiar JSON compatible object:

for part in result.candidates[0].content.parts:
      print(json.dumps(part.function_call.args, indent=4))
{
        "character_name": "Elara",
        "character_description": "a wisp of a girl, all elbows and knees, with eyes the color of a stormy sea"
    }
    {
        "character_name": "Arthur",
        "character_description": "a quiet carpenter with sawdust permanently clinging to his eyebrows, Elara's father"
    }
    {
        "character_description": "a baker whose cinnamon rolls were legendary, Elara's mother",
        "character_name": "Clara"
    }
    {
        "character_description": "a gruff, barrel-chested man with eyes that held a glint of steel and a perpetual scowl etched onto his face",
        "character_name": "Silas"
    }
    {
        "character_description": "the town\u2019s librarian, a kind, bookish man, often lost in the pages of ancient tomes",
        "character_name": "Thomas"
    }
    {
        "place_name": "Havenwood",
        "place_description": "a quiet town, nestled beside a whispering forest"
    }
    {
        "place_description": "a forest near Havenwood",
        "place_name": "the Whispering Woods"
    }
    {
        "place_description": "a dilapidated old mill on the edge of town",
        "place_name": "the old mill"
    }
    {
        "thing_name": "Elara's magic backpack",
        "thing_description": "a simple, worn, leather backpack that held wonders"
    }
    {
        "thing_description": "never emptied, perfect for soothing sore throats or making tea",
        "thing_name": "a bottomless jar of honey"
    }
    {
        "thing_description": "when released, could fly messages faster than the wind",
        "thing_name": "a small, intricately carved wooden bird"
    }
    {
        "thing_name": "a handful of shimmering, iridescent dust",
        "thing_description": "could mend anything broken, from cracked pottery to hurt feelings"
    }
    {
        "thing_name": "a compass",
        "thing_description": "pointed not north, but towards what she needed most"
    }
    {
        "thing_description": "filled with blank pages that would fill with the perfect story, poem, or spell whenever she needed one",
        "thing_name": "a small, leather-bound book"
    }
    {
        "first_character": "Elara",
        "relationship": "father",
        "second_character": "Arthur"
    }
    {
        "relationship": "mother",
        "second_character": "Clara",
        "first_character": "Elara"
    }

Conclusion
----------

While the API can handle structured data extraction problems with pure text input and text output, using function calling is likely more reliable since it lets you define a strict schema, and eliminates a potentially error-prone parsing step.

Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2025-02-05 UTC.