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
  user?: User | null;
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
  const [allQuestions, setAllQuestions] = useState<QuestionHistory[]>([]);
  const [questionText, setQuestionText] = useState<string>("");
  const [submittedSolution, setSubmittedSolution] = useState<string>("");
  const [suggestedSolution, setSuggestedSolution] = useState<string>("");

  //filters
  const [questionTextFilter, setQuestionTextFilter] = useState<string>("");
  const [submittedSolutionFilter, setSubmittedSolutionFilter] = useState<string>("");
  const [suggestedSolutionFilter, setSuggestedSolutionFilter] = useState<string>("");

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
      .then((data: QuestionHistory[]) => setAllQuestions(data));
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

  const deleteQuestion = (_id: string) => {
    if (currentUserId === null) {
      return;
    }
    fetch(`${BASE}/question-history/delete-question`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _id: _id
      }),
    }).then((res) => res.json())
      .then((data) => console.log(data))
      .then(() => getQuestions(currentUserId));
  }

  const allQuestionsList = allQuestions.filter((question: QuestionHistory) => {
    return question.question.includes(questionTextFilter) &&
           question.submittedSolution.includes(submittedSolutionFilter) &&
           question.suggestedSolution.includes(suggestedSolutionFilter);
  }).map((question: QuestionHistory) => {
    return <tr key={question._id}>
        <td></td>
        <td>{question.question}</td>
        <td>{question.submittedSolution}</td>
        <td>{question.suggestedSolution}</td>
        <td>{question.date}</td>
        <td><button onClick={() => deleteQuestion(question._id)}>delete</button></td>
      </tr>;
  });

  return <div>
    <table>
      <thead>
        <tr>
          <th>Add question</th>
          <th>Question</th>
          <th>Submitted Solution</th>
          <th>Suggested Solution</th>
          <th>Date</th>
          <th>Go to button</th>
        </tr>
        <tr>
          <th></th>
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

        {/*filtering*/}
        <tr>
          <th>
            Filter
          </th>
          <th>
            <textarea value={questionTextFilter} style={{resize: "none"}} onChange={(e) => setQuestionTextFilter(e.target.value)}></textarea>
          </th>
          <th>
            <textarea value={submittedSolutionFilter} style={{resize: "none"}} onChange={(e) => setSubmittedSolutionFilter(e.target.value)}></textarea>
          </th>
          <th>
            <textarea value={suggestedSolutionFilter} style={{resize: "none"}} onChange={(e) => setSuggestedSolutionFilter(e.target.value)}></textarea>
          </th>
          <th>
          </th>
          <th>
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
