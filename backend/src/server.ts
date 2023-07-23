import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import * as Automerge from '@automerge/automerge';
import { Client } from './types';
import cors from 'cors';

/* -------------------------------------------------------------------------- */
/*                                Init Express                                */
/* -------------------------------------------------------------------------- */
const app: Express = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
const corsOptions = {
  origin: 'http://localhost:3000',
};
app.use(cors(corsOptions));

// Text editor router:
const textEditorRouter = express.Router();
app.use('/', textEditorRouter);

const port = 3002;

app.listen(port, () => {
  console.log(`Running at https://localhost:${port}`);
});

/* -------------------------------------------------------------------------- */
/*                  List of clients connecting to the server:                 */
/* -------------------------------------------------------------------------- */
let clients: Array<Client> = [];
let doc1 = Automerge.init();

/* ---------------------- SSE to send changes to client --------------------- */

textEditorRouter
  .route('/changes')
  .get((request: Request, response: Response) => {
    const clientId = Date.now();

    const headers = {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    };
    response.writeHead(200, headers);

    const data = `data: ${JSON.stringify({
      clientId: clientId,
      content: doc1.content ? doc1.content : '',
    })}\n\n`;

    response.write(data);

    const newClient = {
      id: clientId,
      response: response,
    };

    clients.push(newClient);

    request.on('close', () => {
      console.log(`${clientId} Connection closed`);
      clients = clients.filter((client) => client.id !== clientId);
    });
  });

/* ------------------------ Update the server content ----------------------- */

textEditorRouter
  .route('/update')
  .put((request: Request, response: Response) => {
    if (!request.body.content || !request.body.clientId) {
      response.status(403);
      response.end();
    }
    let newDoc = Automerge.change(
      Automerge.init(),
      (doc) => (doc.content = request.body.content)
    );

    newDoc = Automerge.merge(newDoc, doc1);
    // If there is a conflict, pick newest version as the winner:
    if (Automerge.getConflicts(newDoc, 'content')) {
      doc1 = Automerge.change(
        Automerge.init(),
        (doc) => (doc.content = request.body.content)
      );

      // Update other clients:
      clients.forEach((client) => {
        if (client.id !== request.body.clientId) {
          console.log('sent to' + client.id);

          client.response.write(
            `data: ${JSON.stringify({ content: request.body.content })}\n\n`
          );
        }
      });
      // response.status(200);
      // response.write({ updated: request.body.content });
      response.end();
    } else {
      // No conflict
      doc1 = newDoc;

      // Update other clients:
      clients.forEach((client) => {
        if (client.id !== request.body.clientId) {
          client.response.write(
            `data: ${JSON.stringify({ content: newDoc.content })}\n\n`
          );
        }
      });

      // response.status(200);
      // response.write({ updated: newDoc.content });
      response.end();
    }
  });
