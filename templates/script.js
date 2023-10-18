API_URL = "http://127.0.0.1:5000";

const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector("#send-btn");

let userMessage = null; // Variable to store user's message
const inputInitHeight = chatInput.scrollHeight;


const createChatLi = (message, className) => {
  // Create a chat <li> element with passed message and className
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", className);
  chatLi.innerHTML =
    className === "outgoing"
      ? `<p></p>`
      : ` <div class="wrapper1">
      <span class="material-symbols-outlined">smart_toy</span>
      <div class="wrapper2">
        <p></p>
        <span id="play_audio" class="material-symbols-outlined play-audio">play_circle</span>
        <audio   style="margin-top:10px;display:none;"  src="">
        </audio>
      </div>
    </div> `;
  chatLi.querySelector("p").textContent = message;
  return chatLi;
};

const generateResponse = async (chatElement) => {
  const url = API_URL + "/ask";
  const options = {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: userMessage,
    }),
  };

  try {
    const response = await fetch(url, options);
    console.log(response);
    const result = await response.json();
    console.log(result);
    chatElement.querySelector("p").textContent = result.response;
    chatElement.querySelector("audio").src = result.audio;
    audio_elt_span = chatElement.querySelector("#play_audio");
    audio_elt_span.addEventListener("click", async function() {
      audiotest = chatElement.querySelector("audio").src;
      let audio = new Audio(audiotest);
      await audio.play();
    });
    console.log(audio_elt_span);
    chatElement.querySelector("audio").setAttribute("controls", "");
  } catch (error) {
    console.error(error);
  } finally {
    () => chatbox.scrollTo(0, chatbox.scrollHeight);
  }
};

const handleChat = () => {
  userMessage = chatInput.value.trim(); // Get user entered message and remove extra whitespace
  if (!userMessage) {
    console.log("userMessage null");
    return;
  }

  // Clear the input textarea and set its height to default
  chatInput.value = "";
  chatInput.style.height = `${inputInitHeight}px`;

  // Append the user's message to the chatbox
  chatbox.appendChild(createChatLi(userMessage, "outgoing"));
  chatbox.scrollTo(0, chatbox.scrollHeight);

  setTimeout(() => {
    // Display "Thinking..." message while waiting for the response
    const incomingChatLi = createChatLi("Thinking...", "incoming");
    chatbox.appendChild(incomingChatLi);
    chatbox.scrollTo(0, chatbox.scrollHeight);
    generateResponse(incomingChatLi);
  }, 600);
};

chatInput.addEventListener("input", () => {
  chatInput.style.height = `${inputInitHeight}px`;
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
    e.preventDefault();
    handleChat();
  }
});

sendChatBtn.addEventListener("click", handleChat);

closeBtn.addEventListener("click", () =>
  document.body.classList.remove("show-chatbot")
);
chatbotToggler.addEventListener("click", () =>
  document.body.classList.toggle("show-chatbot")
);

// audio record
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

function toggleRecording() {
  if (isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    document.getElementById("record-button").classList.remove("recording");
  } else {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(function(stream) {
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];

          mediaRecorder.ondataavailable = function(event) {
            audioChunks.push(event.data);
          };

          mediaRecorder.onstop = function() {
            const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
            console.log(audioBlob);
            sendAudioToServer(audioBlob);
          };

          mediaRecorder.start();
          isRecording = true;
          document.getElementById("record-button").classList.add("recording");
        })
        .catch(function(error) {
          console.error("Error accessing the microphone: " + error);
        });
    } else {
      console.error("getUserMedia is not available in your browser");
    }
  }
}

function sendAudioToServer(audioBlob) {
  const formData = new FormData();
  formData.append("audio", audioBlob);

  fetch("http://127.0.0.1:5000/upload_audio", {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "audio/wav",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      let text;

      if (data.text) {
        text = data.text;
      } else {
        text = data.error;
      }
      const incomingChatLi = createChatLi(text, "incoming");

      const audio_elt = incomingChatLi.querySelector("audio");
      audio_elt.src = data.audio;

      incomingChatLi
        .querySelector("#play_audio")
        .addEventListener("click", async function() {
          audiotest = audio_elt.src;

          let audio = new Audio(audiotest);
          await audio.play();
        });

      chatbox.appendChild(incomingChatLi);
      chatbox.scrollTo(0, chatbox.scrollHeight);
    })
    .catch((error) => {
      console.error("Error sending audio to the server: ", error);
    });
}

document
  .getElementById("record-button")
  .addEventListener("click", toggleRecording);
