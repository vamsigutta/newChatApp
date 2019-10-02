import React, { Component, Fragment } from 'react';
import {SideBarOptions} from './sideBarOptions';
import {get, last, differenceBy} from 'lodash';
import {createChatNameFromUsers} from '../../Factories';

export default class SideBar extends Component{
	static type = {
		CHATS : 'chats',
		USERS : 'users',
	}
	constructor(props) {
		super(props);
		this.state = {
			reciever :'',
			activeSideBar : SideBar.type.CHATS
		};
	}

	handleSubmit = (event) => {
		event.preventDefault();
		const {reciever} = this.state;
		console.log('reciever is ', reciever);
		this.props.onSendDirectMessage(reciever);
		this.setState({reciever:''});
	}

	addChatForUser = (username) => {
		this.setActiveSideBar(SideBar.type.CHATS);
		this.props.onSendDirectMessage(username);
	}

	setActiveSideBar = (newSideBar) => {
		this.setState({
			activeSideBar: newSideBar
		})
	}
		
	render(){
		const { chats, activeChat, user, setActiveChat, logout, users} = this.props
		const {reciever, activeSideBar} = this.state;


		let display;
		if (activeSideBar === SideBar.type.CHATS) {
			display= chats.map((chat)=>{
				if(chat.name){
					return(
						<SideBarOptions 
							key={chat.id}
							name={chat.isGroup ? chat.name : createChatNameFromUsers(chat.users,user.name)} 
							lastMessage={get(last(chat.messages),'message','')}
							active = {activeChat.id === chat.id}
							onClick ={() => this.props.setActiveChat(chat)}
						/>
					)
				}

				return null
			})	
		} else {
			display = differenceBy(users,[user], 'name').map(otherUser => {
				return (
					<SideBarOptions
					key = {otherUser.id}
					name = {otherUser.name}
					onClick = {() => {this.addChatForUser(otherUser.name)}}
					/>
				)
			})

		}
		return (
			<div id="side-bar">
					<div className="heading">
						<div className="app-name">My Chat app</div>
					</div>
					<form onSubmit={this.handleSubmit} className="search">
						<input placeholder="Search" 
						type="text" 
						value={reciever}
						onChange={(event => this.setState({reciever: event.target.value}))}/>
						<div className="plus"></div>
					</form>
					<div className="side-bar-select">
						<div 
						onClick = {() => {this.setActiveSideBar(SideBar.type.CHATS)}}
						className={`side-bar-select__option ${activeSideBar === SideBar.type.CHATS ? 'active': ''}`}>
						<span>Chats</span>
						</div>
						<div 
						onClick = {() => {this.setActiveSideBar(SideBar.type.USERS)}}
						className={`side-bar-select__option ${activeSideBar === SideBar.type.USERS ? 'active': ''}`}>
						<span>Connected Users</span>	
						</div>
					</div>
					<div 
						className="users" 
						ref='users' 
						onClick={(e)=>{ (e.target === this.refs.user) && setActiveChat(null) }}>
							{activeSideBar === SideBar.type.CHATS ? (<form onClick={() => this.props.renderCreateGroupPage()} className="search">
							<input 
								type="button" 
								value="Create Group"/>
								<div className="plus"></div>
						</form> ) : null}
						{display}
					</div>
					<div className="current-user">
						<span>{user.name}</span>
						<div onClick={()=>{logout()}} title="Logout" className="logout">
							<p>logout</p>
						</div>
					</div>
			</div>
		);
	
	}
}
