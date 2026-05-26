import { useState } from "react";
import axios from "axios";

function App() {

  const [formData, setFormData] = useState({
    air_temp: "",
    process_temp: "",
    rpm: "",
    torque: "",
    tool_wear: "",
    machine_type: "",
    idle_time: "",
    cycle_time: ""
  });

  const [result, setResult] = useState(null);

  const [question, setQuestion] = useState("");

  const [chatResponse, setChatResponse] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const predictFailure = async () => {

    try {

      const payload = {
        air_temp: Number(formData.air_temp),
        process_temp: Number(formData.process_temp),
        rpm: Number(formData.rpm),
        torque: Number(formData.torque),
        tool_wear: Number(formData.tool_wear),
        machine_type: Number(formData.machine_type),
        idle_time: Number(formData.idle_time),
        cycle_time: Number(formData.cycle_time)
      };

      console.log("Sending:", payload);

      const response = await axios.post(
        "http://127.0.0.1:8000/predict",
        payload
      );

      console.log(response.data);

      setResult(response.data);

    } catch (error) {

      console.log(error.response?.data);
      console.log(error.message);

    }

  };

  const askChatbot = async () => {

    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/chat",
        {
          question: question,
          air_temp: Number(formData.air_temp),
          process_temp: Number(formData.process_temp),
          rpm: Number(formData.rpm),
          torque: Number(formData.torque),
          tool_wear: Number(formData.tool_wear),
          failure_probability:
            result?.failure_probability || 0
        }
      );

      setChatResponse(response.data.response);

    } catch (error) {

      console.log(error.response?.data);

    }

  };

  return (

    <div className="min-h-screen bg-gray-900 text-white p-8">

      <h1 className="text-5xl font-bold mb-8">
        FactoryPulse AI
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-8">

        <input
          name="air_temp"
          placeholder="Air Temperature"
          onChange={handleChange}
          className="p-4 rounded bg-gray-700"
        />

        <input
          name="process_temp"
          placeholder="Process Temperature"
          onChange={handleChange}
          className="p-4 rounded bg-gray-700"
        />

        <input
          name="rpm"
          placeholder="RPM"
          onChange={handleChange}
          className="p-4 rounded bg-gray-700"
        />

        <input
          name="torque"
          placeholder="Torque"
          onChange={handleChange}
          className="p-4 rounded bg-gray-700"
        />

        <input
          name="tool_wear"
          placeholder="Tool Wear"
          onChange={handleChange}
          className="p-4 rounded bg-gray-700"
        />

        <input
          name="machine_type"
          placeholder="Machine Type"
          onChange={handleChange}
          className="p-4 rounded bg-gray-700"
        />

        <input
          name="idle_time"
          placeholder="Idle Time"
          onChange={handleChange}
          className="p-4 rounded bg-gray-700"
        />

        <input
          name="cycle_time"
          placeholder="Cycle Time"
          onChange={handleChange}
          className="p-4 rounded bg-gray-700"
        />

      </div>

      <button
        onClick={predictFailure}
        className="bg-blue-600 px-6 py-3 rounded mb-8"
      >
        Predict Machine Failure
      </button>

      {result && (

        <div className="bg-gray-800 p-6 rounded mb-8">

          <p>
            Failure Prediction:
            {" "}
            {result.failure_prediction === 1
              ? "Critical Risk"
              : "Healthy"}
          </p>

          <p>
            Failure Probability:
            {" "}
            {(result.failure_probability * 100).toFixed(2)}%
          </p>

          <p>
            Anomaly:
            {" "}
            {result.anomaly_detected === -1
              ? "Detected"
              : "Normal"}
          </p>

          <div className="mt-4">

            <h3 className="font-bold">
              Recommendations
            </h3>

            {result.recommendations.length > 0
              ? result.recommendations.map(
                  (rec, idx) => (
                    <p key={idx}>
                      • {rec}
                    </p>
                  )
                )
              : (
                <p>
                  No maintenance required
                </p>
              )}

          </div>

        </div>

      )}

      <div className="bg-gray-800 p-6 rounded">

        <input
          type="text"
          placeholder="Ask AI..."
          value={question}
          onChange={(e) =>
            setQuestion(e.target.value)
          }
          className="w-full p-3 rounded bg-gray-700"
        />

        <button
          onClick={askChatbot}
          className="bg-green-600 px-6 py-2 mt-4 rounded"
        >
          Ask AI
        </button>

        {chatResponse && (

          <div className="mt-4 bg-gray-700 p-3 rounded">

            {chatResponse}

          </div>

        )}

      </div>

    </div>

  );

}

export default App;