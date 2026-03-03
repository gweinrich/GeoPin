import { useState, useEffect } from 'react'
import debounce from 'lodash/debounce'
import './App.css'

function App() {
  const [inputText, setInputText] = useState('');
  const [countries, setCountries] = useState([]);
  const [guesses, setGuesses] = useState([]);
  const [found, setFound] = useState(false);
  const [answerCountry, setAnswerCountry] = useState('');
  const [answerData, setAnswerData] = useState([]);

  const HandleAnswerData = () => {
    fetch(`https://restcountries.com/v3.1/name/${answerCountry}?fullText=true`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) {
          return;
        }
        setAnswerData([
          "Population: " + data[0].population.toLocaleString('en-US'),
          "Area (sq. km.): " + data[0].area.toLocaleString('en-US'),
          null,
          "Languages: " + Object.values(data[0].languages).join(', '),
          "Capital: " + Object.values(data[0].capital).join(', ')
        ])
        FetchGDP(data[0].cca3);
      })
  }

  const HandleInputText = (event) => {
    const value = event.target.value;
    setInputText(value);
    fetch(`https://restcountries.com/v3.1/name/${value}`)
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        const independentCountries = data.filter(
          c => c.independent === true
        );
        setCountries(Array.isArray(independentCountries) ? independentCountries : []);
      })
      .catch(() => setCountries([]));
  };

  const CheckCountry = (event) => {
    event.preventDefault();
    if(found || guesses.length >= 5) return;
    fetch(`https://restcountries.com/v3.1/name/${inputText}?fullText=true`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0 || guesses.some(guess => guess.name === data[0].name.common)) return;
        setGuesses(prev => [...prev, {
          name: data[0].name.common,
          isCorrect: data[0].name.common === answerCountry
        }]);
        if(data[0].name.common == answerCountry)
          setFound(true);
        
        setInputText("");
      });
  };  

  const FetchGDP = (iso3) => {
    fetch(`https://api.worldbank.org/v2/country/${iso3}/indicator/NY.GDP.MKTP.CD?format=json`)
      .then((res) => {
        if(!res.ok) return "";
        return res.json();
      })
      .then((data) => {
        const latestGDP = data[1]?.find(entry => entry.value !== null).value;
        if (!latestGDP) { return; }
        setAnswerData(prev => {
          const updated = [...prev];
          updated[2] = "GDP in USD: $" + latestGDP.toLocaleString('en-US');
          return updated;
        });
      })
      .catch(() => {return ""});
  }

  useEffect(() => {
    fetch(`https://restcountries.com/v3.1/independent?status=true&fields=name,cca3`)
      .then((res) => {
        return res.json();
      })
      .then(data => {
        const answer = data[Math.floor(Math.random() * data.length)];
        console.log(answer.name.common);
        setAnswerCountry(answer.name.common);
      })
  }, []);

  useEffect(() => {
    if(answerCountry) {
      HandleAnswerData();
    }
  }, [answerCountry]);

  return (
    <>
      <h2>Welcome to GeoPin!</h2>
      <h2>Guess the country within 5 tries. Each guess reveals a new data point about the country.</h2>
      <form onSubmit={CheckCountry} style={{fontSize: "20px"}}>
        <label>Enter a country:{" "}
          <input 
            type="text" 
            value={inputText} 
            list="countries" 
            onChange={HandleInputText}
          />
        </label>
        <datalist id="countries">
          {countries.map((country) => (
            <option value={country.name.common} key={country.name.common}>
              {country.name.common}
            </option>
          ))}
        </datalist>
        <button type="submit" 
          style={{
            margin: "10px", 
            display: "block", 
            alignItems: "center", 
            justifyContent: "center", 
            marginLeft: "auto",
            marginRight: "auto",
            }}>
              Submit
            </button>
      </form>

      <div style={{ marginBottom: "20px" }}>
        {guesses.map((guess, index) => (
          <span
          key={index}
            style={{
              display: "inline-block",
              width: "fit-content",
              minWidth: "150px",
              height: "40px",
              margin: "5px",
              backgroundColor: guess.isCorrect ? '#38c700' : '#f37340',
              color: "white",
              textAlign: "center",
              lineHeight: "40px",
              fontSize: "20px",
              borderRadius: "5px"
            }}
          >
            {guess.name}
          </span>
        ))}
      </div>
      <div style={{ marginBottom: "20px" }}>
        {answerData.map((dataPoint, index) => (
          <span
          key={index}
            style={{
              display: "block",
              width: "fit-content",
              minWidth: "500px",
              height: "40px",
              marginTop: "5px",
              marginLeft: "auto",
              marginRight: "auto",
              backgroundColor: '#52b0bd',
              color: "white",
              textAlign: "center",
              lineHeight: "40px",
              fontSize: "20px",
              borderRadius: "5px",
              alignItems: "center",
              justifyContent: "center",
              visibility: (guesses.length >= index || found) ? "visible" : "hidden"
            }}
          >
            {dataPoint}
          </span>
        ))}
      </div>

    </>
  )
}

export default App
