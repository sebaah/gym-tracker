import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Dumbbell,
  ChartNoAxesCombined,
  History,
  Check,
  Plus,
  Trash2,
  Download,
  ArrowLeft,
} from 'lucide-react';
import './style.css';

type Exercise = {
  name: string;
  sets: number;
  reps: string;
};

type SetLog = {
  weight: string;
  reps: string;
  done: boolean;
};

type WorkoutSession = {
  id: string;
  day: string;
  date: string;
  logs: Record<string, SetLog[]>;
};

type Tab = 'home' | 'history' | 'stats';

// Starter template: verify exact exercise order and prescriptions against program v2.1 before regular use.
const programs: Record<string, Exercise[]> = {
  A: [
    { name: 'Hack-kyykky / takakyykky', sets: 3, reps: '5–10' },
    { name: 'Penkkipunnerrus', sets: 3, reps: '5–8' },
    { name: 'Ylätalja', sets: 3, reps: '8–12' },
    { name: 'Vinopenkki käsipainoilla', sets: 3, reps: '8–12' },
    { name: 'Reidenkoukistus istuen', sets: 3, reps: '10–15' },
    { name: 'Ojentajapunnerrus taljassa', sets: 3, reps: '10–15' },
  ],
  B: [
    { name: 'Maastaveto', sets: 3, reps: '4–6' },
    { name: 'Pystypunnerrus', sets: 3, reps: '6–10' },
    { name: 'Soutu tuettuna', sets: 3, reps: '8–12' },
    { name: 'Sivuvipunostot', sets: 3, reps: '12–20' },
    { name: 'Hauiskääntö', sets: 3, reps: '8–12' },
    { name: 'Vatsalihasliike', sets: 3, reps: '10–15' },
  ],
  C: [
    { name: 'Jalkaprässi', sets: 3, reps: '8–12' },
    { name: 'Vinopenkkipunnerrus', sets: 3, reps: '6–10' },
    { name: 'Alataljasoutu', sets: 3, reps: '8–12' },
    { name: 'Sivuvipunostot', sets: 3, reps: '12–20' },
    { name: 'Hauiskääntö käsipainoilla', sets: 3, reps: '8–12' },
    { name: 'Hauiskääntö taljassa', sets: 2, reps: '10–15' },
  ],
};

function readStoredValue<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

function countCompletedSets(session: WorkoutSession): number {
  return Object.values(session.logs).flat().filter(setLog => setLog.done).length;
}

function createSessionLogs(
  day: string,
  history: WorkoutSession[],
): WorkoutSession['logs'] {
  const logs: WorkoutSession['logs'] = {};

  programs[day].forEach(exercise => {
    const previousSession = history.find(
      session => session.day === day && session.logs[exercise.name],
    );

    logs[exercise.name] = Array.from({ length: exercise.sets }, (_, setIndex) => ({
      weight: previousSession?.logs[exercise.name]?.[setIndex]?.weight || '',
      reps: '',
      done: false,
    }));
  });

  return logs;
}

function calculateTotalVolume(history: WorkoutSession[]): number {
  return history.reduce(
    (totalVolume, session) =>
      totalVolume +
      Object.values(session.logs).flat().reduce(
        (sessionVolume, setLog) =>
          sessionVolume +
          (setLog.done
            ? (Number(setLog.weight) || 0) * (Number(setLog.reps) || 0)
            : 0),
        0,
      ),
    0,
  );
}

type UpdateSetLog = (
  exerciseName: string,
  setIndex: number,
  field: keyof SetLog,
  value: string | boolean,
) => void;

function ExerciseCard({
  exercise,
  exerciseIndex,
  sets,
  onUpdateSet,
}: {
  exercise: Exercise;
  exerciseIndex: number;
  sets: SetLog[];
  onUpdateSet: UpdateSetLog;
}) {
  return (
    <section className="exercise">
      <div className="exerciseHead">
        <span className="number">{String(exerciseIndex + 1).padStart(2, '0')}</span>
        <div>
          <h3>{exercise.name}</h3>
          <p>{exercise.sets} sarjaa · {exercise.reps} toistoa</p>
        </div>
      </div>
      <div className="sethead">
        <span>SARJA</span>
        <span>KG</span>
        <span>TOISTOT</span>
        <span>VALMIS</span>
      </div>
      {sets.map((setLog, setIndex) => (
        <div className="setrow" key={setIndex}>
          <b>{setIndex + 1}</b>
          <input
            aria-label={`${exercise.name} sarja ${setIndex + 1} kilogrammat`}
            inputMode="decimal"
            placeholder="kg"
            value={setLog.weight}
            onChange={event =>
              onUpdateSet(exercise.name, setIndex, 'weight', event.target.value.replace(',', '.'))
            }
          />
          <input
            aria-label={`${exercise.name} sarja ${setIndex + 1} toistot`}
            inputMode="numeric"
            placeholder="kpl"
            value={setLog.reps}
            onChange={event =>
              onUpdateSet(exercise.name, setIndex, 'reps', event.target.value)
            }
          />
          <button
            aria-label="Merkitse sarja valmiiksi"
            className={'check ' + (setLog.done ? 'checked' : '')}
            onClick={() => onUpdateSet(exercise.name, setIndex, 'done', !setLog.done)}
          >
            <Check size={19} />
          </button>
        </div>
      ))}
    </section>
  );
}

function HistoryView({
  history,
  onDeleteSession,
}: {
  history: WorkoutSession[];
  onDeleteSession: (sessionId: string) => void;
}) {
  return (
    <>
      <div className="eyebrow">TREENIPÄIVÄKIRJA</div>
      <h1>Historia</h1>
      {history.length === 0 ? (
        <p className="muted">Ei vielä tallennettuja treenejä.</p>
      ) : (
        history.map(session => (
          <div className="historyCard" key={session.id}>
            <div>
              <strong>Treeni {session.day}</strong>
              <p>
                {new Date(session.date).toLocaleDateString('fi-FI')} · {countCompletedSets(session)} sarjaa
              </p>
            </div>
            <button aria-label="Poista treeni" onClick={() => onDeleteSession(session.id)}>
              <Trash2 size={18} />
            </button>
            <details>
              <summary>Näytä sarjat</summary>
              {Object.entries(session.logs).map(([exerciseName, sets]) => (
                <div className="detail" key={exerciseName}>
                  <b>{exerciseName}</b>
                  <p>
                    {sets
                      .filter(setLog => setLog.done)
                      .map(setLog => `${setLog.weight || '–'} kg × ${setLog.reps || '–'}`)
                      .join(' · ') || 'Ei kirjauksia'}
                  </p>
                </div>
              ))}
            </details>
          </div>
        ))
      )}
    </>
  );
}

function StatsView({
  history,
  onExport,
}: {
  history: WorkoutSession[];
  onExport: () => void;
}) {
  const totalVolume = calculateTotalVolume(history);
  const exerciseNames = Array.from(
    new Set(history.flatMap(session => Object.keys(session.logs))),
  );

  return (
    <>
      <div className="eyebrow">KEHITYS</div>
      <h1>Tilastot</h1>
      <div className="statgrid">
        <div>
          <small>TREENEJÄ</small>
          <strong>{history.length}</strong>
        </div>
        <div>
          <small>VOLYYMI YHT.</small>
          <strong>{Math.round(totalVolume).toLocaleString('fi-FI')} <small>kg</small></strong>
        </div>
      </div>
      <h3>Liikekohtaiset ennätykset</h3>
      {exerciseNames.map(exerciseName => {
        const completedSets = history
          .flatMap(session => session.logs[exerciseName] || [])
          .filter(setLog => setLog.done);
        const maxWeight = Math.max(
          0,
          ...completedSets.map(setLog => Number(setLog.weight) || 0),
        );

        return (
          <div className="previewRow" key={exerciseName}>
            <b>{exerciseName}</b>
            <small>{maxWeight} kg</small>
          </div>
        );
      })}
      <button className="secondary" onClick={onExport}>
        <Download size={17} /> Vie varmuuskopio (JSON)
      </button>
    </>
  );
}

function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [history, setHistory] = useState<WorkoutSession[]>(() =>
    readStoredValue('gym-history', []),
  );
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(() =>
    readStoredValue('gym-active', null),
  );
  const [selectedDay, setSelectedDay] = useState('A');

  useEffect(() => {
    localStorage.setItem('gym-history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('gym-active', JSON.stringify(activeSession));
    } else {
      localStorage.removeItem('gym-active');
    }
  }, [activeSession]);

  const completedSets = activeSession ? countCompletedSets(activeSession) : 0;
  const totalSets = activeSession ? Object.values(activeSession.logs).flat().length : 0;

  function startSession() {
    const logs = createSessionLogs(selectedDay, history);

    setActiveSession({
      id: crypto.randomUUID(),
      day: selectedDay,
      date: new Date().toISOString(),
      logs,
    });
  }

  const updateSetLog: UpdateSetLog = (exerciseName, setIndex, field, value) => {
    setActiveSession(session =>
      session
        ? {
            ...session,
            logs: {
              ...session.logs,
              [exerciseName]: session.logs[exerciseName].map((setLog, index) =>
                index === setIndex ? { ...setLog, [field]: value } : setLog,
              ),
            },
          }
        : session,
    );
  };

  function finishSession() {
    if (!activeSession) return;
    if (!completedSets) {
      alert('Kirjaa vähintään yksi sarja ennen tallennusta.');
      return;
    }

    setHistory(sessions => [activeSession, ...sessions]);
    setActiveSession(null);
    setTab('history');
  }

  function cancelSession() {
    if (confirm('Keskeytetäänkö treeni? Kirjaukset poistuvat.')) {
      setActiveSession(null);
    }
  }

  function deleteSession(sessionId: string) {
    if (confirm('Poistetaanko treeni?')) {
      setHistory(sessions => sessions.filter(session => session.id !== sessionId));
    }
  }

  function exportData() {
    const blob = new Blob(
      [JSON.stringify({ version: 1, history, active: activeSession }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'gym-tracker-backup.json';
    downloadLink.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <header>
        <div className="brand">
          <span className="logo"><Dumbbell size={23} /></span>
          <div>
            <strong>GYM TRACKER</strong>
            <small>TRAIN SMARTER · V0.1</small>
          </div>
        </div>
        <span className="version">ABC 2.1*</span>
      </header>
      {activeSession ? (
        <main>
          <button className="back" onClick={cancelSession}>
            <ArrowLeft size={17} /> Keskeytä
          </button>
          <div className="eyebrow">TREENI {activeSession.day} · KÄYNNISSÄ</div>
          <h1>Hyvä treeni! <span>💪</span></h1>
          <div className="progress">
            <div style={{ width: `${totalSets ? completedSets / totalSets * 100 : 0}%` }} />
          </div>
          <p className="muted">{completedSets} / {totalSets} sarjaa valmiina</p>
          {programs[activeSession.day].map((exercise, exerciseIndex) => (
            <ExerciseCard
              key={exercise.name}
              exercise={exercise}
              exerciseIndex={exerciseIndex}
              sets={activeSession.logs[exercise.name]}
              onUpdateSet={updateSetLog}
            />
          ))}
          <button className="primary finish" onClick={finishSession}>
            <Check size={19} /> Tallenna treeni
          </button>
        </main>
      ) : (
        <main>
          {tab === 'home' ? (
            <>
              <div className="eyebrow">OMA TREENIPÄIVÄKIRJA</div>
              <h1>Jokainen sarja<br /><em>vie eteenpäin.</em></h1>
              <p className="muted intro">
                Valitse päivän harjoitus ja aloita. Edellisen treenin painot tulevat automaattisesti mukaan.
              </p>
              <div className="sectionTitle">
                VALITSE TREENI <span>3 PÄIVÄÄ / VIIKKO</span>
              </div>
              <div className="days">
                {Object.keys(programs).map(day => (
                  <button
                    key={day}
                    className={'day ' + (selectedDay === day ? 'selected' : '')}
                    onClick={() => setSelectedDay(day)}
                  >
                    <small>TREENI</small>
                    <strong>{day}</strong>
                    <span>{programs[day].length} liikettä</span>
                  </button>
                ))}
              </div>
              <div className="preview">
                <h3>Treeni {selectedDay} <span>OHJELMA 2.1*</span></h3>
                {programs[selectedDay].map((exercise, exerciseIndex) => (
                  <div className="previewRow" key={exercise.name}>
                    <span>{String(exerciseIndex + 1).padStart(2, '0')}</span>
                    <b>{exercise.name}</b>
                    <small>{exercise.sets} × {exercise.reps}</small>
                  </div>
                ))}
              </div>
              <button className="primary" onClick={startSession}>
                <Plus size={20} /> Aloita treeni {selectedDay}
              </button>
              <p className="notice">
                * Liikejärjestys ja sarjamäärät ovat alustava pohja, eivät vielä vahvistettu alkuperäinen 2.1-ohjelma.
              </p>
            </>
          ) : tab === 'history' ? (
            <HistoryView history={history} onDeleteSession={deleteSession} />
          ) : (
            <StatsView history={history} onExport={exportData} />
          )}
        </main>
      )}
      <nav>
        {([
          ['home', Dumbbell, 'Treeni'],
          ['history', History, 'Historia'],
          ['stats', ChartNoAxesCombined, 'Kehitys'],
        ] as const).map(([tabId, Icon, label]) => (
          <button
            key={tabId}
            className={tab === tabId ? 'on' : ''}
            onClick={() => {
              if (!activeSession) setTab(tabId);
            }}
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
