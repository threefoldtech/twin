/* eslint-disable */
const socket = io('http://localhost:3000');

const message = document.getElementById('message');
const messages = document.getElementById('messages');

const handleSubmitNewMessage = () => {
    console.log('submitted');
    socket.emit('message', { data: message.value });
};

socket.on('message', ({ data }) => {
    handleNewMessage(data);
});

const handleNewMessage = msg => {
    messages.appendChild(buildNewMessage(msg));
};

const buildNewMessage = msg => {
    const li = document.createElement('li');
    li.appendChild(document.createTextNode(msg));
    return li;
};
