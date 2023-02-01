import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { Readable, Transform } from "node:stream";
import { WritableStream, TransformStream } from "node:stream/web"; 
import csvtojson from "csvtojson";
import { Buffer } from "node:buffer";
import { setTimeout } from "node:timers/promises";

const PORT = 8081;


createServer(async (request, response) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*"
  }
  
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  let items = 0;


  request.once("close", () => console.log("connection was closed!", items));

  // <createReadStream> funciona apenas no node
  // <WritableStream> faz a conversão para que os dados possam ser consumidos pelo cliente 
  Readable.toWeb(createReadStream("./netflix_titles_2021.csv"))
  //pipeThrough é o passo a passo (pode usar varios)
  .pipeThrough(Transform.toWeb(csvtojson()))
  
  .pipeThrough(new TransformStream(({
    transform(chunk, controller) {
      const chunkData = JSON.parse(Buffer.from(chunk));

      controller.enqueue(JSON.stringify({
        title: chunkData.title,
        country: chunkData.country,
        releaseYear: chunkData.release_year,
        duration: chunkData.duration,
        description: chunkData.description
      }).concat("\n\n"));
    }
  })))
  
  // pipeTo é o passo final
  .pipeTo(new WritableStream({
    async write(chunk) {
      await setTimeout(200);
      items++;
      response.write(chunk);
    },
    close() {
      response.end();
    }
  }));

  response.writeHead(200, headers);

})
.listen(PORT)
.on("listening", () => console.log(`Server is running at ${PORT}`))
