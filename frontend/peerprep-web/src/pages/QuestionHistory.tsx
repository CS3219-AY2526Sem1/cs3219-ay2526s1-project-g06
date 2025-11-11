import { useEffect, useState } from 'react';
import { useAuth } from "../auth/AuthContext";

const BASE = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:4005`;

type QuestionHistory = {
  _id: string;
  userId: String,
  title: String,
  topic: String,
  difficulty: String,
  description: String,
  submittedSolution: String,
  date: Date,
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
  const [titleFilter, setTitleFilter] = useState<string>("");
  const [topicFilter, setTopicFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");

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
        title: questionText,
        topic: submittedSolution,
        difficulty: suggestedSolution,
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
    return question.title.includes(titleFilter) &&
           question.topic.includes(topicFilter) &&
           question.difficulty.includes(difficultyFilter);
  }).map((question: QuestionHistory) => {
    return <tr key={question._id}>
        <td></td>
        <td>{question.title}</td>
        <td>{question.topic}</td>
        <td>{question.difficulty}</td>
        <td>{question.date}</td>
        <td><button onClick={() => deleteQuestion(question._id)}>delete</button></td>
      </tr>;
  });

  return <div>
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Title</th>
          <th>Topic</th>
          <th>Difficulty</th>
          <th>Date</th>
          <th></th>
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
            <textarea value={titleFilter} style={{resize: "none"}} onChange={(e) => setTitleFilter(e.target.value)}></textarea>
          </th>
          <th>
            <textarea value={topicFilter} style={{resize: "none"}} onChange={(e) => setTopicFilter(e.target.value)}></textarea>
          </th>
          <th>
            <textarea value={difficultyFilter} style={{resize: "none"}} onChange={(e) => setDifficultyFilter(e.target.value)}></textarea>
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
