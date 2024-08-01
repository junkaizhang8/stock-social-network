import { useState, useEffect } from 'react';
import apiService from '../../services/api';
import alert from '../../utils/alert';
import onLastPage from '../../utils/on-last-page';

const Friends = () => {
  const [page, setPage] = useState(0);
  const [friends, setFriends] = useState([]);
  const [friendsTotal, setFriendsTotal] = useState(0);
  const [requests, setRequests] = useState([]);
  const [requestsTotal, setRequestsTotal] = useState(0);
  const [showFriends, setShowFriends] = useState(true);

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

  const getFriendRequests = async () => {
    apiService.getFriendRequests(page).then((res) => {
      const body = res.data;
      setRequests(body.requests);
      setRequestsTotal(body.total);
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  };

  const acceptRequest = (name) => {
    apiService.acceptFriendRequest(name).then(() => {
      alert.success('Request accepted');
      getFriendRequests();
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  };

  const rejectRequest = (name) => {
    apiService.declineFriendRequest(name).then(() => {
      alert.success('Request rejected');
      getFriendRequests();
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  };

  const previousPage = () => {
    if (page === 0) return;
    setPage(page - 1);
    showFriends ? getFriends() : getFriendRequests();
  };

  const nextPage = () => {
    if (onLastPage(page, 10, showFriends ? friendsTotal : requestsTotal)) return;
    setPage(page + 1);
    showFriends ? getFriends() : getFriendRequests();
  };

  const handleFriendRequest = (e) => {
    e.preventDefault();
    const name = e.target[0].value;
    if (name === '') return;
  
    sendFriendRequest(name);
    e.target[0].value = '';
  }

  const showFriendsList = () => {
    if (!showFriends) {
      setPage(0);
      getFriends();
      setShowFriends(true);
      document.getElementById('friendsList').classList.remove('hidden');
      document.getElementById('requestsList').classList.add('hidden');
    }
  }

  const showRequestsList = () => {
    if (showFriends) {
      setPage(0);
      getFriendRequests();
      setShowFriends(false);
      document.getElementById('friendsList').classList.add('hidden');
      document.getElementById('requestsList').classList.remove('hidden');
    }
  }

  return (
    <>
      <button
        className='btn'
        onClick={showFriendsList}
        disabled={showFriends}>
          My Friends
      </button>
      <button
        className='btn'
        onClick={showRequestsList}
        disabled={!showFriends}>
          Friend Requests
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
      <div id='requestsList'>
        {requests.map((request) => (
          <div key={request.user_id}>
            <span>{request.username}</span>
            <button onClick={() => acceptRequest(request.username)}>Accept</button>
            <button onClick={() => rejectRequest(request.username)}>Reject</button>
          </div>
        ))}
      </div>
      <button className={page === 0 && 'disabled'} onClick={previousPage}>&lt;</button>
      <button className={onLastPage(page, 10, showFriends ? friendsTotal : requestsTotal) && 'disabled'} onClick={nextPage}>&gt;</button>
    </>
  );
}

export default Friends;