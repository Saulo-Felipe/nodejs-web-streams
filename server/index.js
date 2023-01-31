import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { Readable, Transform } from "node:stream";
import { WritableStream, TransformStream } from "node:stream/web"; 
import svgtojson from "csvtojson";

const PORT = 8081;


createServer(async (request, response) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*"
  }
  
  if (request.method === "OPTIONS") {
    response.writeHead(204, headers);
    response.end();
    return;
  }

  // <createReadStream> funciona apenas no node
  // <WritableStream> faz a conversão para que os dados possam ser consumidos pelo cliente 

  Readable.toWeb(createReadStream("./animals_info.csv"))
  //pipeThrough é o passo a passo (pode usar varios)
  .pipeThrough(Transform.toWeb(svgtojson()))
  .pipeThrough(new TransformStream(({
    transform(chunk, controller) {
      console.log("\n\nchunk: ", Buffer.from(chunk).toString());
      controller.enqueue(chunk);
    }
  })))
  // pipeTo é o passo final
  .pipeTo(new WritableStream({
    write(chunk) {
      response.write(chunk);
    },
    close() {
      response.end();
    }
  }));


  response.writeHead(200, headers);
  //response.end("ok");
})
.listen(PORT)
.on("listening", () => console.log(`Server is running at ${PORT}`))


