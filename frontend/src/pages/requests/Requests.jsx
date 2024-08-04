import { useState } from 'react';
import apiService from '../../services/api';

const Requests = () => {
  const [requests, setRequests] = useState([]);

  const getRequests = async () => {
    apiService.getRequests().then((res) => {
      const body = res.data;
      if (res.status !== 200) {
        console.error(body.error);
        return;
      }
      setRequests(body.requests);
    });
  };

  const acceptRequest = (name) => {
    apiService.acceptRequest(name).then((res) => {
      const body = res.data;
      if (res.status !== 200) {
        console.error(body.error);
        return;
      }
      getRequests();
    });
  };

  const rejectRequest = (name) => {
    apiService.rejectRequest(name).then((res) => {
      const body = res.data;
      if (res.status !== 200) {
        console.error(body.error);
        return;
      }
      getRequests();
    });
  };

  return (
    <>
      <h1>Requests</h1>
      <div>
        {requests.map((request) => (
          <div key={request.user_id}>
            <span>{request.user_id}</span>
            <button onClick={() => acceptRequest(request.user_id)}>Accept</button>
            <button onClick={() => rejectRequest(request.user_id)}>Reject</button>
          </div>
        ))}
      </div>
    </>
  );
}

export default Requests;