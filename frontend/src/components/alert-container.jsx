import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AlertContainer = () => {
  return (
    <ToastContainer
      position="bottom-center"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  )
};

export default AlertContainer;