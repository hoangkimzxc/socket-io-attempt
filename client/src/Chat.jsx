import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";

function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes(),
      };
      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    socket.on("typing", (data) => {
      if (data.room === room) {
        setTypingUsers((users) => {
          if (!users.includes(data.username)) {
            return [...users, data.username];
          }
          return users;
        });

        setTimeout(() => {
          setTypingUsers((users) =>
            users.filter((user) => user !== data.username)
          );
        }, 2000);
      }
    });

    socket.on("load_old_messages", (oldMessages) => {
      setMessageList(oldMessages);
    });

    socket.on("clear_chat_history", () => {
      setMessageList([]); // Clear chat history
    });

    // Request old messages after socket connection is established
    socket.on("connect", () => {
      socket.emit("join_room", room);
    });

    return () => {
      socket.removeListener("receive_message");
      socket.removeListener("typing");
      socket.removeListener("load_old_messages");
      socket.removeListener("connect");
    };
  }, [socket, room]);

  const handleInputChange = () => {
    socket.emit("typing", { username, room });
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <p>Username: {username}</p>
      </div>
      <div className="chat-body">
        <ScrollToBottom className="message-container">
          {messageList.map((messageContent, index) => (
            <div
              key={index}
              className="message"
              id={username === messageContent.author ? "you" : "other"}
            >
              <div>
                <div className="message-content">
                  <p>{messageContent.message}</p>
                </div>
                <div className="message-meta">
                  <p id="time">{messageContent.time}</p>
                  <p id="author">{messageContent.author}</p>
                  <p></p>
                </div>
              </div>
            </div>
          ))}
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"}{" "}
              typing...
            </div>
          )}
        </ScrollToBottom>
      </div>
      <div className="chat-footer">
        <input
          type="text"
          placeholder="Hey..."
          value={currentMessage}
          onChange={(e) => {
            setCurrentMessage(e.target.value);
            handleInputChange();
          }}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />
        <button
          onClick={() => {
            sendMessage();
          }}
        >
          &#9658;
        </button>
      </div>
    </div>
  );
}

export default Chat;
