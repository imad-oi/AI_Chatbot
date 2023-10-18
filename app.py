import http.client
import json

from flask import Flask, request, jsonify
from flask_cors import CORS

import tempfile

import base64

from gtts import gTTS

import speech_recognition as sr
from util import audio


API_URL = 'https://chatgpt-gpt4-ai-chatbot.p.rapidapi.com/ask'
API_KEY = '1aabc9467cmshd0be18d587bddcfp130452jsn51b26441d0d2'
API_HOST = 'chatgpt-gpt4-ai-chatbot.p.rapidapi.com'

app = Flask(__name__)
CORS(app)


def get_chatbot_response(query):
    conn = http.client.HTTPSConnection(API_HOST)

    payload = json.dumps({"query": query})

    headers = {
        'content-type': "application/json",
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST
    }

    conn.request("POST", "/ask", payload, headers)

    res = conn.getresponse()
    data = res.read()

    return data.decode("utf-8")


def generate_audio(text):
    if not text:
        return ""
    
    tts = gTTS(text=text, lang="en")
    
    # Save the generated audio to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmpfile:
        tts.save(tmpfile.name)
    
    # Encode the audio data as base64
    with open(tmpfile.name, 'rb') as audio_file:
        audio_data = audio_file.read()
        audio_base64 = base64.b64encode(audio_data).decode()
    
    # Pass the audio source URL to the template
    audio_element_code = f'data:audio/mpeg;base64,{audio_base64}'

    return audio_element_code

@app.route('/')
def hello_world():
    return 'Hello World!'



@app.route('/ask', methods=['POST'])
def ask_chatbot():
    if request.method == 'POST':
        try:
            data = request.get_json()
            query = data.get("query")
            response = get_chatbot_response(query)
            print(response)
            text = json.loads(response).get("response")

            return json.dumps({
                "response": text,
                "audio": generate_audio(text)
             })
        
        except Exception as e:
            return json.dumps({"error": str(e)})



@app.route('/upload_audio', methods=['POST'])
def upload_audio():
    audio_data = request.data
    
    recognizer = sr.Recognizer()

    new_audio = sr.AudioData(audio_data, 44100, 2)
    try:
        text = recognizer.recognize_google(new_audio, language="en-EN") 

        return jsonify({'text': text, 'audio':generate_audio(text)})
    except sr.UnknownValueError:
        return jsonify({'error': 'Could not understand the audio'})
    except sr.RequestError as e:
        return jsonify({'error': f"Could not request results from Google Speech Recognition service; {e}"})



if __name__ == '__main__':
    app.run()
