import { useState } from 'react';
import apiService from '../../services/api';
import onLastPage from '../../utils/on-last-page';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const getRequests = async () => {
    apiService.getRequests(page).then((res) => {
      const body = res.data;
      if (res.status !== 200) {
        console.error(body.error);
        return;
      }
      setRequests(body.requests);
      setTotal(body.total);
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

  const previousPage = () => {
    if (page === 0) return;
    setPage(page - 1);
    getRequests();
  };

  const nextPage = () => {
    if (onLastPage(page, 10, total)) return;
    setPage(page + 1);
    getRequests();
  }

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