# To run the project, go into both backend & frontend:

`npm i`<br>
`npm run dev`

# Design Choices For Backend:

SSE was used to send updates to clients.<br>
Websocket is another alternative that makes bi-directional communication easier (vs SSE for server-to-client and PUT requests for client-to-server). I used SSE because I'm more familiar with it and it sticks to HTTP.<br>
Automerge `https://automerge.org/` was used to resolve any merge conflicts.

# Design Choices For Frontend:

EventSource for listening to updates and everything else is pretty straight forward.
