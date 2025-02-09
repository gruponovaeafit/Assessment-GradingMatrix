import { useState } from "react";


const useSendValue = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const sendValue = async (value) => {
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const response = await fetch("#", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: value }),
      });

      if (!response.ok) throw new Error("Error al enviar el valor");

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { sendValue, loading, error, success };
};

export default useSendValue;
