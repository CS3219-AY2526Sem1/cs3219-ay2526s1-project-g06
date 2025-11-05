import { useEffect, useState } from 'react';
import { useAuth } from "../auth/AuthContext";

const BASE = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:4005`;

type QuestionHistory = {
  _id: string;
  question: string;
  submittedSolution: string;
  suggestedSolution: string;
  date: string;
}

type User = {
  sub?: string;
  [key: string]: any;
}
type QuestionHistoryProps = {
  user?: User;
};

const QuestionHistoryComponent = ({ user } : QuestionHistoryProps) => {

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // first load
  useEffect(() => {
    getQuestions(currentUserId);
  }, []);
  
  // loading userid
  useEffect(() => {
    if (user?.sub) {
      console.log(user);
      setCurrentUserId(user.sub);
      getQuestions(user.sub);
    }
  }, [user?.sub]);

  //temporary text of all questions
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionText, setQuestionText] = useState<string>("");
  const [submittedSolution, setSubmittedSolution] = useState<string>("");
  const [suggestedSolution, setSuggestedSolution] = useState<string>("");

  const getQuestions = (id: string | null) => {
    if (id === null) {
      return;
    }
    console.log(`fetching ${BASE}/question-history/get-questions`);
    fetch(`${BASE}/question-history/get-questions`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({userId: id}),
    }).then((res) => res.json())
      .then((data: Question[]) => setAllQuestions(data));
  };

  //one button to add question
  const addQuestion = () => {
    if (currentUserId === null) {
      return;
    }
    fetch(`${BASE}/question-history/add-question`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: currentUserId,
        question: questionText,
        submittedSolution: submittedSolution,
        suggestedSolution: suggestedSolution,
      }),
    }).then((res) => res.json())
      .then((data) => console.log(data))
      .then(() => getQuestions(currentUserId));

    //reset values
    setQuestionText("");
    setSubmittedSolution("");
    setSuggestedSolution("");
  };

  const allQuestionsList = allQuestions.map((question) => {
    return <tr key={question._id}>
        <th>{question.question}</th>
        <th>{question.submittedSolution}</th>
        <th>{question.suggestedSolution}</th>
        <th>{question.date}</th>
        <th><button>This is a button</button></th>
      </tr>;
  });

  return <div>
    <h1>Hello {currentUserId}</h1>
    <div>
      <button onClick={getQuestions}>Refresh</button>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Question</th>
          <th>Submitted Solution</th>
          <th>Suggested Solution</th>
          <th>Date</th>
          <th>Go to button</th>
        </tr>
        <tr>
          <th>
            <textarea value={questionText} style={{resize: "none"}} onChange={(e) => setQuestionText(e.target.value)}></textarea>
          </th>
          <th>
            <textarea value={submittedSolution} style={{resize: "none"}} onChange={(e) => setSubmittedSolution(e.target.value)}></textarea>
          </th>
          <th>
            <textarea value={suggestedSolution} style={{resize: "none"}} onChange={(e) => setSuggestedSolution(e.target.value)}></textarea>
          </th>
          <th>
            no entry
          </th>
          <th>
            <button onClick={addQuestion}>Add</button>
          </th>
        </tr>
      </thead>
      <tbody>
        {allQuestionsList}
      </tbody>
    </table>
  </div>
}


export default QuestionHistoryComponent;
