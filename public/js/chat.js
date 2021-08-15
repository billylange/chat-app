const socket = io();

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const urlTemplate = document.querySelector('#url-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true } )

const autoScroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have we scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
}

socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('hh:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
})

socket.on('locationMessage', (url) => {
  console.log(url);
  const html = Mustache.render(urlTemplate,{
    username: url.username,
    url: url.url,
    createdAt: moment(url.createdAt).format('hh:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
})

socket.on('roomData', ({room, users}) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html;
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute('disabled', 'disabled');

  const message = e.target.elements.message.value;
  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();
    if (error) {
      return console.log(error)
    }
    console.log('The message was delivered!');
  });
})

$sendLocationButton.addEventListener('click', (e) => {
  // if (navigator.geolocation) {
  //   return alert('Geolacation is not supported by your browser.');
  // }
  $sendLocationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation',{
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }, (error) => {
      $sendLocationButton.removeAttribute('disabled');
      if (error) {
        return console.log(error);
      }
      console.log('Location Shared!');
    })
  })
})

socket.emit('join', {username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
