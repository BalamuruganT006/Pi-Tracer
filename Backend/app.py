from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # This lets your React Flow frontend connect!

@app.route('/')
def home():
    return jsonify({"message": "pi-tracer backend is live!"})

if __name__ == '__main__':
    app.run(debug=True)