import { useState, useEffect } from 'react';
import apiService from '../../services/api';
import alert from '../../utils/alert';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [friendsTotal, setFriendsTotal] = useState(0);
  const [inRequests, setInRequests] = useState([]);
  const [inRequestsTotal, setInRequestsTotal] = useState(0);
  const [outRequests, setOutRequests] = useState([]);
  const [outRequestsTotal, setOutRequestsTotal] = useState(0);
  const [mode, setMode] = useState("friends");

  useEffect(() => {
    getFriends();
  });

  const sendFriendRequest = (name) => {
    apiService.sendFriendRequest(name).then((res) => {
      const body = res.data;
      alert.success(body.message);
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  };

  const getFriends = async () => {
    apiService.getFriends().then((res) => {
      const body = res.data;
      setFriends(body.friends);
      setFriendsTotal(body.total);
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  };

  const deleteFriend = (name) => {
    apiService.deleteFriend(name).then(() => {
      alert.success('Friend deleted');
      getFriends();
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  };

  const getIncomingFriendRequests = async () => {
    apiService.getIncomingFriendRequests().then((res) => {
      const body = res.data;
      setInRequests(body.requests);
      setInRequestsTotal(body.total);
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  };

  const getOutgoingFriendRequests = async () => {
    apiService.getOutgoingFriendRequests().then((res) => {
      const body = res.data;
      setOutRequests(body.requests);
      setOutRequestsTotal(body.total);
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  };

  const acceptRequest = (name) => {
    apiService.acceptFriendRequest(name).then(() => {
      alert.success('Request accepted');
      getIncomingFriendRequests();
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  };

  const rejectRequest = (name) => {
    apiService.declineFriendRequest(name).then(() => {
      alert.success('Request rejected');
      getIncomingFriendRequests();
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  };

  const handleFriendRequest = (e) => {
    e.preventDefault();
    const name = e.target[0].value;
    if (name === '') return;
  
    sendFriendRequest(name);
    e.target[0].value = '';
  }

  const showFriendsList = () => {
    if (mode !== 'friends') {
      getFriends();
      setMode('friends');
      document.getElementById('friendsList').classList.remove('hidden');
      document.getElementById('incomingRequestsList').classList.add('hidden');
      document.getElementById('outgoingRequestsList').classList.add('hidden');
    }
  }

  const showIncomingRequestsList = () => {
    if (mode !== 'incoming') {
      getIncomingFriendRequests();
      setMode('incoming');
      document.getElementById('friendsList').classList.add('hidden');
      document.getElementById('incomingRequestsList').classList.remove('hidden');
      document.getElementById('outgoingRequestsList').classList.add('hidden');
    }
  }

  const showOutgoingRequestsList = () => {
    if (mode !== 'outgoing') {
      getOutgoingFriendRequests();
      setMode('outgoing');
      document.getElementById('friendsList').classList.add('hidden');
      document.getElementById('incomingRequestsList').classList.add('hidden');
      document.getElementById('outgoingRequestsList').classList.remove('hidden');
    }
  }

  return (
    <>
      <button
        className='btn'
        onClick={() => showFriendsList()}
        disabled={mode === 'friends'}>
          My Friends
      </button>
      <button
        className='btn'
        onClick={() => showIncomingRequestsList()}
        disabled={mode === 'incoming'}>
          Incoming Requests
      </button>
      <button
        className='btn'
        onClick={() => showOutgoingRequestsList()}
        disabled={mode === 'outgoing'}>
          Outgoing Requests
      </button>
      <form className='simple-form' onSubmit={handleFriendRequest}>
        <input className='form-input' type='text' placeholder='Username' />
        <input className='form-submit' type='submit' value='Send request' />
      </form>
      <div id='friendsList'>
        {friends.map((friend) => (
          <div key={friend.user_id}>
            <span>{friend.username}</span>
            <button onClick={() => deleteFriend(friend.username)}>Delete</button>
          </div>
        ))}
      </div>
      <div id='incomingRequestsList'>
        {inRequests.map((request) => (
          <div key={request.user_id}>
            <span>{request.username}</span>
            <button onClick={() => acceptRequest(request.username)}>Accept</button>
            <button onClick={() => rejectRequest(request.username)}>Reject</button>
          </div>
        ))}
      </div>
      <div id='outgoingRequestsList'>
        {outRequests.map((request) => (
          <div key={request.user_id}>
            <span>{request.username}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default Friends;