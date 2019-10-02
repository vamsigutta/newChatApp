import React, { Component } from 'react';
import SideBar from '../sideBar/SideBar'
import { COMMUNITY_CHAT, 
	DIRECT_MESSAGE, 
	MESSAGE_SENT, 
	MESSAGE_RECIEVED, 
	TYPING, USER_CONNECTED, USER_DISCONNECTED,
	NEW_CHAT_USER, GROUP_CHAT} from '../../Events'
import ChatHeading from './ChatHeading'
import Messages from '../messages/Messages'
import MessageInput from '../messages/MessageInput'
import {values, difference, differenceBy} from 'lodash';


export default class ChatContainer extends Component {
	constructor(props) {
	  super(props);	
	
	  this.state = {
		  chats:[],
		  users : [],
		  activeChat:null,
		  groupName: '',
		  groupUsers:'',
	  };
	  this.oldActiveChat = this.state.activeChat;
	}

	componentDidMount() {
		const { socket } = this.props
		// socket.emit(COMMUNITY_CHAT, this.resetChat)
		this.initSocket(socket)
	}

	componentWillUnmount = () => {
		const {socket} = this.props;
		socket.off(DIRECT_MESSAGE);
		socket.off(USER_CONNECTED);
		socket.off(USER_DISCONNECTED);
		socket.off(NEW_CHAT_USER);
	}

	initSocket = (socket) => {
		socket.emit(COMMUNITY_CHAT, this.resetChat);
		socket.on(DIRECT_MESSAGE, this.addChat);
		socket.on('connect', () => {
			socket.emit(COMMUNITY_CHAT, this.resetChat);
		})
		socket.on(USER_CONNECTED, (users) => {
			this.setState({
				users : values(users)
			})
			socket.on(USER_DISCONNECTED, (users) => {
				const removedUsers = differenceBy(this.state,users,values(users));
				this.removeUsersFromChat(removedUsers);
				this.setState({
					users : values(users)
				})
			})

			socket.on(NEW_CHAT_USER, this.addUsersToChat)
		})
	}

	sendOpenPrivateMessage = (reciever) => {
		const { socket, user } = this.props;
		const {activeChat} = this.state;
		socket.emit(DIRECT_MESSAGE, {reciever, sender: user.name, activeChat})
	}


	addUsersToChat = ({chatId, newUser}) => {
		const {chats} = this.state;
		const newChats = chats.map((chat) => {
			if(chat.id === chatId) {
				return Object.assign({}, chat, {users:[...chat.users, newUser]})
			}
			return chat;
		});
		this.setState({
			chats : newChats
		})
	}

	removeUsersFromChat = ( removedUsers) => {
		const {chats} = this.state;
		const newChats = chats.map((chat) => {
			let newUsers = difference(chat.users, removedUsers.map(user => user.name));
			return Object.assign({},chat, {users : [...newUsers]})
		})
		this.setState({
			chats : newChats
		})
	}
	
	resetChat = (chat)=>{
		return this.addChat(chat, true)
	}

	addChat = (chat, reset=false)=>{
		const { socket } = this.props
		const { chats } = this.state

		const newChats = reset ? [chat] : [...chats, chat]
		this.setState({chats:newChats, activeChat:reset ? chat : this.state.activeChat})

		const messageEvent = `${MESSAGE_RECIEVED}-${chat.id}`
		const typingEvent = `${TYPING}-${chat.id}`

		socket.on(typingEvent, this.updateTypingInChat(chat.id))
		socket.on(messageEvent, this.addMessageToChat(chat.id))
	}

	groupNameHandler = (event) => [
		this.setState({
			groupName : event.target.value
		})
	]

	groupUsersHandler = (event) => {
		this.setState({
			groupUsers : event.target.value
		})
	}

	createGroup = () => {
		const {socket} = this.props;
		if (this.state.groupName.trim() !== '' && this.state.groupUsers.length > 1) {
			let groupUsers = this.state.groupUsers.split(' ');
			let groupName = this.state.groupName;
			this.setState({
				groupUsers: groupUsers,
				activeChat : this.oldActiveChat
			});
			socket.emit(GROUP_CHAT, {name: groupName, users: groupUsers});
		}
	}

	addMessageToChat = (chatId)=>{
		return message => {
			const { chats } = this.state
			let newChats = chats.map((chat)=>{
				if(chat.id === chatId)
					chat.messages.push(message)
				return chat
			})

			this.setState({chats:newChats})
		}
	}

	updateTypingInChat = (chatId) =>{
		return ({isTyping, user})=>{
			if(user !== this.props.user.name){

				const { chats } = this.state

				let newChats = chats.map((chat)=>{
					if(chat.id === chatId){
						if(isTyping && !chat.typingUsers.includes(user)){
							chat.typingUsers.push(user)
						}else if(!isTyping && chat.typingUsers.includes(user)){
							chat.typingUsers = chat.typingUsers.filter(u => u !== user)
						}
					}
					return chat
				})
				this.setState({chats:newChats})
			}
		}
	}

	sendMessage = (chatId, message)=>{
		const { socket } = this.props
		socket.emit(MESSAGE_SENT, {chatId, message} )
	}

	sendTyping = (chatId, isTyping)=>{
		const { socket } = this.props
		socket.emit(TYPING, {chatId, isTyping})
	}

	setActiveChat = (activeChat)=>{
		this.setState({activeChat})
	}

	renderCreateGroupPage = () => {
		this.oldActiveChat = this.state.activeChat;
		this.setActiveChat('createGroup');
	}

	render() {
		const { user, logout } = this.props
		const { chats, activeChat, users } = this.state
		let display;
		if (activeChat === null) {
			display=(
				<div className="chat-room choose">
							<h3>Choose a chat!</h3>
				</div>
			);
		}else if (activeChat === 'createGroup') {
			display= (
				<div className="chat-room choose">
							<form className="search">
								<label htmlFor="groupName">
									<h4>Group Name</h4>
								</label>
								<input id="groupName" type="text" className="form-control" onChange={this.groupNameHandler}/>
								<h4>Users</h4>
								<input type="text" id="autoFillUsers" onChange={this.groupUsersHandler}/>
								<button className="Save" onClick={this.createGroup} >Save</button>
							</form>
				</div>

			);
		} else {
			console.log('activechat is ', activeChat);
			display = (
					<div className="chat-room">
						<ChatHeading name={activeChat.name} />
							<Messages 
								messages={activeChat.messages}
								user={user}
								typingUsers={activeChat.typingUsers}
								/>
							<MessageInput 
								sendMessage={
								(message)=>{
								this.sendMessage(activeChat.id, message)
								}
								}
								sendTyping={
									(isTyping)=>{
									this.sendTyping(activeChat.id, isTyping)
									}
								}
							/>

					</div>
			);
		}
		return (
			<div className="container">
				<SideBar
					logout={logout}
					chats={chats}
					user={user}
					users={users}
					activeChat={activeChat}
					setActiveChat={this.setActiveChat}
					onSendDirectMessage={this.sendOpenPrivateMessage}
					renderCreateGroupPage={this.renderCreateGroupPage}
					/>
				<div className="chat-room-container">
					{display}
				</div>

			</div>
		);
	}
}
