const API_URL = "http://localhost:8081";
let processedDataCount = 0;

async function consumeAPI(signal) {
  const response = await fetch(API_URL, {
    signal
  });

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJSON())
    /*.pipeTo(new WritableStream({
      write(chunk) {
        console.log("chunk", chunk);
      }
    }))*/

  return reader;
}


function appendToHTML(element, count) {
  return new WritableStream({
    write(chunk) {
      element.innerHTML += `
        <div class="card">
          <h2 class="title">${chunk.title}</h2>
          <hr>
          <div class="description">${chunk.description}</div>
        </div>      
      `;

      count.innerHTML = ++processedDataCount;
    }
  });
}

// Caso venha 2 chunks em uma única request
function parseNDJSON() {
  let ndjsonbuffer = "";

  return new TransformStream({
    transform(chunk, controller) {
      ndjsonbuffer += chunk;
      
      const items = ndjsonbuffer.split("\n");
      
      items.filter(e => e !== "").forEach(item => controller.enqueue(JSON.parse(item)));

      // reset buffer with ""
      ndjsonbuffer = items[items.length - 1];
    },
    flush(controller) {
      console.log("flush controller: ", controller);
      if (!ndjsonbuffer) return;

      controller.enqueue(JSON.parse(ndjsonbuffer));
    }
  })
}

const [
  startBtn,
  stopBtn,
  cards,
  countContainer
] = ["start", "stop", "cards", "count"].map(element => document.querySelector(`.${element}`));

let abortController = new AbortController();

startBtn.addEventListener("click", async () => {
  const readable = await consumeAPI(abortController.signal);
  
  readable.pipeTo(appendToHTML(cards, countContainer), { signal: abortController.signal });
});

stopBtn.addEventListener("click", async () => {
  abortController.abort();
  console.log("aborting...");
  abortController= new AbortController();
});