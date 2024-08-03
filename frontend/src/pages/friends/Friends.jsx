import { useState, useEffect } from 'react';
import apiService from '../../services/api';
import alert from '../../utils/alert';
import onLastPage from '../../utils/on-last-page';

const Friends = () => {
  const [page, setPage] = useState(0);
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
    apiService.getFriends(page).then((res) => {
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
    apiService.getIncomingFriendRequests(page).then((res) => {
      const body = res.data;
      setInRequests(body.requests);
      setInRequestsTotal(body.total);
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  };

  const getOutgoingFriendRequests = async () => {
    apiService.getOutgoingFriendRequests(page).then((res) => {
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

  const previousPage = () => {
    if (page === 0) return;
    setPage(page - 1);
    if (mode === 'friends') getFriends();
    else if (mode === 'incoming') getIncomingFriendRequests();
    else getOutgoingFriendRequests();
  };

  const nextPage = () => {
    if (onLastPage(page, 10, showFriends ? friendsTotal : requestsTotal)) return;
    setPage(page + 1);
    if (mode === 'friends') getFriends();
    else if (mode === 'incoming') getIncomingFriendRequests();
    else getOutgoingFriendRequests();
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
      setPage(0);
      getFriends();
      setMode('friends');
      document.getElementById('friendsList').classList.remove('hidden');
      document.getElementById('incomingRequestsList').classList.add('hidden');
      document.getElementById('outgoingRequestsList').classList.add('hidden');
    }
  }

  const showIncomingRequestsList = () => {
    if (mode !== 'incoming') {
      setPage(0);
      getIncomingFriendRequests();
      setMode('incoming');
      document.getElementById('friendsList').classList.add('hidden');
      document.getElementById('incomingRequestsList').classList.remove('hidden');
      document.getElementById('outgoingRequestsList').classList.add('hidden');
    }
  }

  const showOutgoingRequestsList = () => {
    if (mode !== 'outgoing') {
      setPage(0);
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