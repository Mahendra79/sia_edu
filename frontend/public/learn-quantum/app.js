const chapters = [
  { title: 'Quantum Fundamentals', time: '8 min read', intro: 'Quantum computing begins with a deceptively small question: what if information could exist in more than one state at once?', type: 'Concepts & intuition' },
  { title: 'Mathematical Foundations', time: '10 min read', intro: 'The math of quantum mechanics is a language for possibility. Let us learn just enough of it to make the invisible legible.', type: 'Vectors & probability' },
  { title: 'Quantum Gates', time: '9 min read', intro: 'Quantum gates transform quantum states. They are represented by matrices and arranged into circuits to build quantum algorithms. A gate changes amplitudes and relative phases; later gates can make those changes interfere before measurement turns amplitudes into classical outcomes.', type: 'Operations & transformations' },
  { title: 'Quantum Circuits', time: '11 min read', intro: 'A circuit turns a sequence of ideas into an experiment. Read one from left to right and watch a computation unfold.', type: 'Patterns & architecture' },
  { title: 'Quantum Algorithms', time: '12 min read', intro: 'Quantum algorithms are not magic shortcuts. They are carefully shaped interference patterns that make the right answers louder.', type: 'Search & discovery' },
  { title: 'Quantum Simulation', time: '10 min read', intro: 'Nature is already quantum. Simulation lets us borrow a quantum computer as a microscope for molecules, materials, and matter.', type: 'Models & experiments' },
  { title: 'Quantum Frameworks', time: '8 min read', intro: 'Tools turn theory into runnable circuits. Meet the frameworks, workflows, and habits that make quantum code useful.', type: 'Tools & practice' },
  { title: 'Quantum Applications', time: '9 min read', intro: 'The field is still young, but its questions are ambitious: new medicines, new materials, and new ways to sense the world.', type: 'Frontiers & impact' }
];

// Additive learning supports for the Phase 1 lessons. These blocks wrap the
// existing lesson markup without changing its source content or interactions.
const phaseOneLessonSupport = {
  'fundamentals-0': {
    objectives: ['Describe what quantum information is used for.', 'Distinguish a classical bit from a qubit at a high level.', 'Explain the prepare, transform, and measure cycle.'],
    prerequisites: ['No prior quantum or advanced-math knowledge is required.'],
    introduction: 'A quantum computation starts with a system, changes it through operations, and reads a classical result. The goal is to design those operations so useful outcomes become more likely.',
    steps: ['Start with the question or task the computation should address.', 'Prepare a quantum state that represents the starting information.', 'Apply operations that shape amplitudes, phase, and correlations.', 'Measure the system and interpret the resulting classical data.'],
    takeaways: ['Quantum computers process quantum states using quantum operations.', 'A measurement returns classical data.', 'Quantum effects are useful when a circuit makes desired outcomes more likely.']
  },
  'fundamentals-1': {
    objectives: ['Recognize the basis states |0⟩ and |1⟩.', 'Read a simple qubit state description.', 'Distinguish a qubit state from the result of one measurement.'],
    prerequisites: ['Start with <a href="#basics-1">Quantum Fundamentals → Introduction</a>.'],
    introduction: 'A qubit is described by a quantum state. That description can include contributions from both basis outcomes, while a measurement produces one definite result.',
    steps: ['Identify the basis states that describe the possible measurement outcomes.', 'Read the state coefficients as amplitudes, not as ordinary probabilities.', 'Use squared amplitude magnitudes to find outcome probabilities.', 'Keep the full state description separate from the single result of a measurement.'],
    takeaways: ['A qubit has a state described using amplitudes for |0⟩ and |1⟩.', 'A measurement gives one result according to the state’s probabilities.', 'The state contains information beyond one observed result.']
  },
  'fundamentals-2': {
    objectives: ['Explain superposition in terms of a quantum state.', 'Relate amplitudes to measurement probabilities.', 'Explain why one measurement does not return both basis outcomes.'],
    prerequisites: ['Review <a href="#basics-2">Qubit</a> and <a href="#math-complex-numbers">Complex Numbers</a>.'],
    introduction: 'Superposition means a state includes multiple possible outcomes before measurement. It does not mean a single measurement displays every outcome at once.',
    steps: ['Read the state’s amplitudes for each basis outcome.', 'Square each amplitude’s magnitude to calculate its probability.', 'Check that the probabilities add to one for a normalized state.', 'Interpret a measurement as one sampled outcome from that distribution.'],
    takeaways: ['Amplitudes describe the quantum state; their squared magnitudes give measurement probabilities.', 'One trial returns one result.', 'Repeated measurements reveal the underlying probability distribution.']
  },
  'fundamentals-3': {
    objectives: ['Describe entanglement as a property of a joint state.', 'Identify correlated outcomes in a Bell-state example.', 'Distinguish correlation from communication.'],
    prerequisites: ['Review <a href="#basics-2">Qubit</a> and <a href="#basics-3">Superposition</a>.'],
    introduction: 'Two entangled qubits must be described together. Their measurement results can be linked even though neither qubit alone captures the full shared state.',
    steps: ['Prepare the first qubit in a superposition.', 'Use a controlled operation to connect the qubits.', 'Read the resulting joint state, rather than treating the qubits as independent.', 'Compare repeated pair measurements and identify their correlation.'],
    takeaways: ['Entanglement is a property of the joint state.', 'A Bell pair produces correlated outcomes in the demonstrated measurement basis.', 'Correlation does not let one qubit send a controllable message to the other.']
  },
  'fundamentals-4': {
    objectives: ['Calculate simple measurement probabilities.', 'Describe how measurement produces a classical record.', 'Distinguish a single sampled result from the predicted distribution.'],
    prerequisites: ['Review <a href="#basics-2">Qubit</a> and <a href="#basics-3">Superposition</a>.'],
    introduction: 'Measurement converts a quantum state into a classical result. The state determines the probabilities, but a single trial only shows one outcome.',
    steps: ['Identify the state and the measurement basis.', 'Calculate each possible result’s probability from its amplitude.', 'Take one measurement and record the returned result.', 'Repeat the experiment to compare the observed frequencies with the prediction.'],
    takeaways: ['Measurement returns a classical outcome.', 'The quantum state determines outcome probabilities.', 'Finite samples can differ from the exact predicted distribution.']
  },
  'math-complex-numbers': {
    objectives: ['Identify real and imaginary parts of a complex number.', 'Interpret a complex number as a point or arrow.', 'Explain how magnitude and phase are useful in quantum states.'],
    prerequisites: ['Basic arithmetic is enough; no prior complex-number experience is needed.'],
    introduction: 'A complex number has two components that can be drawn as coordinates on a plane. In quantum mechanics, its length and direction help describe an amplitude.',
    steps: ['Locate the real part along the horizontal axis.', 'Locate the imaginary part along the vertical axis.', 'Use the distance from the origin as the magnitude.', 'Use the direction from the origin as the phase, which can affect later interference.'],
    takeaways: ['Complex numbers have real and imaginary components.', 'Magnitude and phase carry different information.', 'Phase can matter even when an immediate measurement probability is unchanged.']
  },
  'math-vectors-inner-products': {
    objectives: ['Read a vector as an ordered list of components.', 'Explain what normalization means.', 'Interpret an inner product as a measure of overlap.'],
    prerequisites: ['Review <a href="#math-complex-numbers">Complex Numbers</a>; familiarity with sums and squares is helpful.'],
    introduction: 'A vector stores several values together. A quantum state vector stores amplitudes, and its normalization ensures the probabilities represented by those amplitudes sum to one.',
    steps: ['Identify each component and its associated basis state.', 'Calculate the norm using component magnitudes.', 'Normalize the vector so its norm is one.', 'Use the inner product to compare two vectors or calculate their overlap.'],
    takeaways: ['State-vector components are amplitudes.', 'A normalized state has total probability one.', 'Inner products quantify overlap between vectors.']
  },
  'math-tensor-products': {
    objectives: ['Explain why separate systems need a joint state space.', 'Determine how the number of basis states grows when systems are combined.', 'Distinguish a product state from an entangled state.'],
    prerequisites: ['Review <a href="#math-vectors-inner-products">Vectors and Inner Products</a>; basic multiplication is helpful.'],
    introduction: 'Combining systems means listing their joint possibilities. A tensor product is the mathematical rule that builds the combined state from the parts.',
    steps: ['List the basis states available to each subsystem.', 'Pair each state of the first system with each state of the second.', 'Combine amplitudes according to the tensor-product rule.', 'Check whether the resulting joint state can be separated into independent subsystem states.'],
    takeaways: ['Joint state spaces grow multiplicatively.', 'Tensor products combine amplitudes and basis states.', 'Entangled states cannot be written as a product of independent subsystem states.']
  },
  'math-matrices-matrix-operations': {
    objectives: ['Read a matrix as a rule that transforms a vector.', 'Interpret a matrix-vector product.', 'Recognize trace, inverse, and conjugate transpose in context.'],
    prerequisites: ['Review <a href="#math-vectors-inner-products">Vectors and Inner Products</a>; basic multiplication is helpful.'],
    introduction: 'A matrix is a structured way to describe how a vector changes. Quantum gates use this idea to transform state vectors.',
    steps: ['Identify the input vector and matrix dimensions.', 'Multiply each matrix row by the input vector to get one output component.', 'Read the output as the transformed vector.', 'Relate any trace, inverse, or dagger operation in the example to the property being checked.'],
    takeaways: ['Matrix-vector multiplication applies a transformation.', 'The output components depend on the matrix and input state.', 'Matrix properties help describe and check quantum operations.']
  },
  'math-eigenvalues-eigenvectors': {
    objectives: ['Identify an eigenvector and its eigenvalue.', 'Explain the special action an operator has on an eigenvector.', 'Connect observable eigenvalues with possible measurement outcomes.'],
    prerequisites: ['Review <a href="#math-matrices-matrix-operations">Matrices and Matrix Operations</a> and <a href="#math-vectors-inner-products">Vectors and Inner Products</a>.'],
    introduction: 'Most transformations change a vector’s direction. An eigenvector is a special vector whose direction stays the same; its eigenvalue tells how the operator scales it.',
    steps: ['Apply the operator to the candidate vector.', 'Check whether the result is a scalar multiple of the original.', 'Read that scalar as the eigenvalue.', 'For an observable, interpret its eigenvalues as possible measurement values.'],
    takeaways: ['Eigenvectors are special states for an operator.', 'The eigenvalue is the associated scale factor.', 'Observable eigenvalues correspond to possible measurement results.']
  },
  'math-hermitian-unitary-matrices': {
    objectives: ['Distinguish Hermitian and unitary matrices.', 'Explain the role of Hermitian operators in measurement.', 'Explain why unitary gates preserve valid state vectors.'],
    prerequisites: ['Review <a href="#math-matrices-matrix-operations">Matrices and Matrix Operations</a> and <a href="#math-eigenvalues-eigenvectors">Eigenvalues and Eigenvectors</a>.'],
    introduction: 'Two matrix properties answer different questions: Hermitian matrices describe measurable quantities, while unitary matrices describe reversible quantum transformations.',
    steps: ['Form the conjugate transpose of the matrix.', 'Compare it with the original to check the Hermitian property.', 'For unitarity, multiply the conjugate transpose by the matrix.', 'Interpret the identity result as preservation of lengths and valid state normalization.'],
    takeaways: ['Hermitian operators model observables.', 'Unitary operators model valid reversible gates.', 'These properties connect the math to measurement and state evolution.']
  },
  'gate-set': {
    objectives: ['Describe a gate as a state transformation.', 'Compare single-qubit and controlled gates.', 'Explain why gate order can change the result.'],
    prerequisites: ['Review <a href="#basics-2">Qubit</a>, <a href="#math-matrices-matrix-operations">Matrices and Matrix Operations</a>, and <a href="#math-hermitian-unitary-matrices">Hermitian and Unitary Matrices</a>.'],
    introduction: 'A quantum gate is an operation applied to a qubit or register. A circuit’s result depends on both which gates are used and the order in which they act.',
    steps: ['Read the input state before applying a gate.', 'Identify which qubit or qubits the gate acts on.', 'Apply the gate’s documented transformation to the state.', 'Compare the output state and probabilities, keeping phase changes in mind.'],
    takeaways: ['Gates transform quantum states.', 'Controlled gates act on relationships between qubits.', 'Gate order matters because transformations need not commute.']
  },
  'circuit-intro': {
    objectives: ['Identify qubits, gates, and measurements in a circuit.', 'Read the circuit operations in order.', 'Relate the final state to measured output.'],
    prerequisites: ['Review <a href="#basics-2">Qubit</a> and <a href="#gate-introduction">The Gate Set</a>.'],
    introduction: 'A quantum circuit is a recipe: it starts with qubits, applies gates in a chosen order, and measures selected parts to produce classical data.',
    steps: ['Read the initial qubit lines and their starting states.', 'Follow each gate from left to right and note its target qubits.', 'Track how the state changes after each layer.', 'At measurement, connect possible outcomes to their predicted probabilities.'],
    takeaways: ['Circuits organize quantum operations in sequence.', 'Intermediate states help explain how a result is produced.', 'Measurement outcomes are sampled from the circuit’s final state.']
  },
  'algorithms': {
    objectives: ['State the task an algorithm example addresses.', 'Identify its preparation, operation, and measurement stages.', 'Interpret its reported result in the context of the run.'],
    prerequisites: ['Review <a href="#circuit-1">Introduction to Quantum Circuits</a> and <a href="#gate-introduction">The Gate Set</a>.'],
    introduction: 'A quantum algorithm is a sequence of operations designed for a particular task. Start with the question it asks, then inspect how the circuit encodes and reads the answer.',
    steps: ['Read the example’s inputs and determine what result it seeks.', 'Identify how the starting state is prepared.', 'Follow the algorithm’s gates or oracle and note how they change the state.', 'Interpret the measured result using the example’s stated settings and output.'],
    takeaways: ['Each algorithm has a specific task and assumptions.', 'The circuit’s operations shape measurement probabilities.', 'A saved result describes that run; it is not a guarantee for every finite sample.']
  },
  'simulation-modes': {
    objectives: ['Recognize common simulation representations.', 'Relate a representation to the information it retains.', 'Identify tradeoffs involving circuit structure, noise, and resources.'],
    prerequisites: ['Review <a href="#math-vectors-inner-products">Vectors and Inner Products</a> and <a href="#circuit-7">Circuit Execution &amp; Simulation</a>.'],
    introduction: 'A simulation mode is a way to represent and calculate a circuit on a classical computer. Different representations suit different circuit structures and questions.',
    steps: ['Identify the mode named in the example.', 'Ask what state information that mode represents, such as a pure state or a mixed state.', 'Check whether noise, sampling, or circuit structure affects the choice.', 'Read resource estimates and output in light of those assumptions.'],
    takeaways: ['No single simulation representation suits every circuit.', 'The chosen mode affects what can be represented and what resources are needed.', 'Interpret results together with their mode and assumptions.']
  },
  'browser-playground': {
    objectives: ['Recognize the role of the HDQS playground.', 'Map a chain of commands to circuit operations.', 'Interpret the generated playground and its documented output.'],
    prerequisites: ['Review <a href="#circuit-1">Introduction to Quantum Circuits</a> and <a href="#sia-doc-1">Basic Circuits</a>. Basic Python familiarity is helpful but not required to follow the example.'],
    introduction: 'HDQS provides commands for describing and inspecting quantum programs. The browser playground packages a documented circuit into an interactive page for exploration.',
    steps: ['Read the register size and identify the qubits.', 'Follow each chained operation in order.', 'Relate the generated page to the circuit it loads.', 'Use the playground to inspect the circuit step by step and connect operations with the resulting state.'],
    takeaways: ['A chain of HDQS operations describes an ordered circuit.', 'The playground makes a circuit easier to inspect interactively.', 'The generated filename confirms the artifact; it is distinct from a measurement result.']
  }
};

function lessonSupportMarkup(key) {
  const support = phaseOneLessonSupport[key];
  if (!support) return '';
  const list = (items) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
  return `<section class="visual-card lesson-support-card" aria-label="Learning objectives and prerequisites"><h3>Learning Objectives</h3>${list(support.objectives)}<h3>Prerequisites</h3>${list(support.prerequisites)}<h3>Plain-language Introduction</h3><p>${support.introduction}</p></section>`;
}

function addLessonSupport(key) {
  const support = phaseOneLessonSupport[key];
  if (!support) return;
  const body = $('#lesson-body');
  body.insertAdjacentHTML('afterbegin', lessonSupportMarkup(key));
  body.insertAdjacentHTML('beforeend', `<section class="visual-card lesson-support-card" aria-label="Step-by-step explanation"><h3>Step-by-step Explanation</h3><ol>${support.steps.map((step) => `<li>${step}</li>`).join('')}</ol></section><aside class="key-idea lesson-support-takeaways"><span class="card-label">Key Takeaways</span>${support.takeaways.map((item) => `<p>${item}</p>`).join('')}</aside>`);
}

const fundamentalsTopics = [
  { title: 'Introduction', time: '8 min read', intro: 'Learn the core concepts that form the foundation of quantum computing. Understand how quantum mechanics works and why it enables new possibilities in computing.', type: 'Concepts & intuition' },
  { title: 'Qubit', time: '6 min read', intro: 'A qubit is the smallest unit of quantum information, with a state that can be described as a blend of two possibilities.', type: 'Concepts & intuition' },
  { title: 'Superposition', time: '7 min read', intro: 'A qubit can exist in a superposition of |0⟩ and |1⟩. Its probability amplitudes describe the likelihood of each result when the qubit is measured.', type: 'Concepts & intuition' },
  { title: 'Entanglement', time: '7 min read', intro: 'Quantum entanglement is a phenomenon where two or more quantum systems become connected through a shared quantum state, creating correlations that cannot be described independently.', type: 'Concepts & intuition' },
  { title: 'Measurement', time: '5 min read', intro: 'Quantum measurement is the process of observing a quantum state and obtaining a definite classical result.', type: 'Concepts & intuition' }
];
const mathematicsTopics = [
  { slug: 'complex-numbers', title: 'Complex Numbers', time: '8 min read', intro: 'Quantum mechanics uses complex numbers to represent and manipulate quantum states. A complex number has a real part and an imaginary part.', type: 'Complex numbers & phase' },
  { slug: 'vectors-inner-products', title: 'Vectors and Inner Products', time: '9 min read', intro: 'Vectors represent quantum states; inner products compare them, and normalization makes total measurement probability one.', type: 'Vectors & notation' },
  { slug: 'tensor-products', title: 'Tensor Products', time: '11 min read', intro: 'Tensor products combine the state spaces of separate quantum systems and provide the mathematical structure for multi-qubit registers.', type: 'Multiple systems' },
  { slug: 'matrices-matrix-operations', title: 'Matrices and Matrix Operations', time: '10 min read', intro: 'Matrices represent linear transformations and quantum operators. Their action changes state vectors; determinant, trace, inverse and dagger reveal useful properties.', type: 'Matrix operations' },
  { slug: 'eigenvalues-eigenvectors', title: 'Eigenvalues and Eigenvectors', time: '8 min read', intro: 'An eigenvector keeps its direction under an operator; its eigenvalue tells how it is scaled. For observables, eigenvalues correspond to possible measurement results.', type: 'Eigenvectors & measurement' },
  { slug: 'hermitian-unitary-matrices', title: 'Hermitian and Unitary Matrices', time: '8 min read', intro: 'Hermitian matrices represent observables, while unitary matrices represent valid reversible quantum transformations.', type: 'Matrix properties' },
  { slug: 'matrix-vector-multiplication', title: 'Matrix–Vector Multiplication', time: '8 min read', intro: 'A quantum gate acts on a state by matrix multiplication. This is the basic mathematical operation behind applying gates to qubits.', type: 'State transformations' },
  { slug: 'dirac-notation', title: 'Dirac Notation (Bra-Ket)', time: '9 min read', intro: 'Dirac notation gives a compact language for quantum states and their dual vectors. A ket is a column vector; its bra is the conjugate transpose.', type: 'Kets, bras & inner products' },
  { slug: 'quantum-states-observables', title: 'Quantum States and Observables', time: '9 min read', intro: 'Kets describe quantum states, while observables are represented by Hermitian operators whose eigenvalues are measurable results.', type: 'Quantum states & observables' },
  { slug: 'expectation-measurement', title: 'Expectation Values and Measurement', time: '10 min read', intro: 'Expectation values describe average measurement results; variance and uncertainty describe their spread.', type: 'Observables & measurement' },
  { slug: 'quantum-dynamics-uncertainty', title: 'Quantum Dynamics and Uncertainty', time: '10 min read', intro: 'Hamiltonians govern quantum-state evolution, and uncertainty relations constrain incompatible observables.', type: 'Dynamics & uncertainty' },
  { slug: 'sequential-measurement', title: 'Sequential Measurement and Post-Selection', time: '9 min read', intro: 'A measurement changes the state available to later measurements. Post-selection keeps only runs matching chosen outcomes.', type: 'Measurement sequences' },
  { slug: 'mathematical-explorers', title: 'Mathematical Explorers', time: '10 min read', intro: 'Interactive mathematical explorers connect abstract equations with geometric and physical behaviour.', type: 'Interactive mathematics' }
];
const circuitTopics = [
  { title: 'Introduction to Quantum Circuits', intro: 'Learn how a circuit organizes qubits, gates, and measurement into a quantum computation.' },
  { title: 'Gates in Circuits', intro: 'See how ordered gate operations transform quantum states.' },
  { title: 'Single-Qubit Circuits', intro: 'Build small circuits that transform one qubit at a time.' },
  { title: 'Multi-Qubit Circuits', intro: 'Use controlled operations to work with joint quantum states.' },
  { title: 'Quantum Circuit Operations', intro: 'Understand sequencing, parallelism, composition, and inverse operations.' },
  { title: 'Measurement & Circuit Results', intro: 'Turn quantum measurement outcomes into useful classical data.' },
  { title: 'Circuit Execution & Simulation', intro: 'Compare ideal simulation, shot sampling, and real quantum hardware.' },
  { title: 'Quantum Circuit Examples', intro: 'Bring the ideas together in short, complete circuits.' }
];
const circuitStudyTopics = [
  {
    title: 'Measurement and Feed-Forward',
    intro: 'Learn how measurement results become classical information that can control later operations.',
    sections: [
      ['Measurement produces classical outcomes', 'For |ψ⟩ = α|0⟩ + β|1⟩, a computational-basis measurement returns 0 with probability |α|² or 1 with probability |β|². The result is a classical bit; after measurement, later steps use that recorded value rather than the unmeasured superposition.'],
      ['Use a result to control a later step', 'Feed-forward means using a measurement result to choose a later operation. If the measured bit is c, a classical condition can select one operation when c = 0 and another when c = 1. This connects quantum measurement with ordinary conditional control.'],
      ['Read the circuit in stages', 'First prepare and measure a quantum register. Next record the outcome in a classical register. Finally use that record to decide which later operation or correction to apply. The order matters: the classical decision can only use a result that has already been measured.']
    ]
  },
  {
    title: 'Analysing Quantum States',
    intro: 'Connect state amplitudes, probabilities, and measurement data when inspecting a quantum computation.',
    sections: [
      ['A state is a vector of amplitudes', 'An n-qubit pure state has 2ⁿ complex amplitudes, one for each computational-basis bit string: |ψ⟩ = Σₓ αₓ|x⟩. The state is normalized when Σₓ|αₓ|² = 1.'],
      ['Convert amplitudes into probabilities', 'The Born rule gives P(x) = |αₓ|². Probabilities describe the ideal distribution; repeated measurements produce counts that estimate it and can vary from run to run.'],
      ['State inspection and sampling answer different questions', 'A state vector retains amplitude and phase information, while computational-basis probabilities retain only squared magnitudes. Two states can therefore have the same immediate measurement probabilities but respond differently to later gates.']
    ]
  },
  {
    title: 'Observables and Hamiltonians',
    intro: 'Understand how measurable quantities are represented by operators and how Hamiltonians describe energy and evolution.',
    sections: [
      ['An observable represents a measurement', 'A quantum observable is represented by a Hermitian operator O. Its eigenvalues oₖ are possible measurement results, with eigenstates satisfying O|oₖ⟩ = oₖ|oₖ⟩.'],
      ['Expectation values summarize outcomes', 'For a state |ψ⟩, the expected value is ⟨O⟩ = ⟨ψ|O|ψ⟩. It is the probability-weighted average of many measurements, not necessarily the result of any single measurement.'],
      ['Hamiltonians describe energy and evolution', 'A Hamiltonian H represents the energy of a system. With ℏ = 1, the Schrödinger equation is i d|ψ⟩/dt = H|ψ⟩; for a time-independent H, evolution is |ψ(t)⟩ = e^(−iHt)|ψ(0)⟩.']
    ]
  },
  {
    title: 'Noise and Error Mitigation',
    intro: 'Distinguish ideal circuit predictions from noisy results and learn what error mitigation can—and cannot—do.',
    sections: [
      ['Where noise enters a circuit', 'Physical devices have imperfect gates, finite coherence, and readout errors. These effects can change measured counts from the ideal distribution and may accumulate as a circuit grows deeper.'],
      ['Mitigation estimates a less-biased result', 'Error mitigation uses calibration or repeated measurements under controlled variations to estimate the result that an ideal circuit would produce. It can reduce some biases, but it does not make noisy hardware error-free.'],
      ['Check the limits of a corrected estimate', 'Compare mitigated results with the unmitigated data and an appropriate ideal or classical reference when available. Report the method and uncertainty: mitigation is an estimate, not a substitute for quantum error correction or evidence that all errors were removed.']
    ]
  }
];
const circuitsAndGatesTopics = [
  { title: 'Basic Circuits', route: { group: 'circuit', index: 0 } },
  { title: 'The Gate Set', route: { group: 'gate', page: 'introduction' } },
  ...circuitStudyTopics.map((topic, index) => ({ title: topic.title, route: { group: 'circuit-study', index } }))
];
const algorithmTopics = [
  { title: 'Deutsch Algorithm', intro: 'Use one query to determine whether a one-bit function is constant or balanced.', goal: 'The Deutsch algorithm asks whether f(0) and f(1) are the same or different. Classically, the answer requires checking both inputs; with a quantum oracle, the algorithm can reveal the property with one query.', steps: ['Prepare a query qubit in |0⟩ and an auxiliary qubit in |1⟩.', 'Apply H gates so the query explores both inputs while the auxiliary qubit prepares phase kickback.', 'Apply the oracle, then H to the query qubit and measure it.'], result: 'A measurement of 0 indicates a constant function; 1 indicates a balanced function. The lesson is not that every problem needs fewer queries, but that phase can encode useful global information.' },
  { title: 'Deutsch-Jozsa Algorithm', intro: 'Generalize Deutsch’s question to distinguish constant and balanced functions across many inputs.', goal: 'Deutsch-Jozsa considers a promised function on n-bit inputs: it is either constant for every input or balanced, returning 0 for half the inputs and 1 for the other half.', steps: ['Prepare n input qubits in |0⟩ and one auxiliary qubit in |1⟩.', 'Use Hadamard gates, call the oracle once, and apply Hadamards to the input register.', 'Measure the input register and look for the all-zero result.'], result: 'All zeros means the function is constant; any nonzero bit string means it is balanced, under the promise. It is a clean example of using interference to learn a property without reading every function value.' },
  { title: 'Bernstein-Vazirani Algorithm', intro: 'Recover a hidden bit string by turning an oracle’s phase pattern into a measurement result.', goal: 'The oracle hides a bit string s and computes a parity-like function f(x) = s·x mod 2. The challenge is to identify every bit of s.', steps: ['Prepare the input register in |0...0⟩ and an auxiliary qubit in |1⟩.', 'Apply Hadamards and query the oracle, which encodes the hidden string as relative phases.', 'Apply Hadamards to the input register and measure it.'], result: 'In the ideal algorithm, the measurement returns the hidden string s in one oracle query. Each input qubit’s phase becomes a directly readable bit after the final Hadamard layer.' },
  { title: "Simon's Algorithm", intro: 'Find a hidden XOR period in a function whose outputs come in matched pairs.', goal: 'Simon’s problem promises a nonzero hidden string s such that f(x) = f(y) exactly when y = x ⊕ s. The aim is to learn s without listing the function table.', steps: ['Create equal superposition over input strings and query the oracle.', 'Measure the output register; this leaves the input register in a state related to a pair separated by s.', 'Apply Hadamards and measure the input register repeatedly to collect equations about s.'], result: 'Each run gives a bit string y satisfying y·s = 0 mod 2. Classical linear algebra combines enough independent equations to recover s. The algorithm highlights a hybrid workflow: quantum samples first, classical post-processing finishes the task.' },
  { title: "Grover's Algorithm", intro: 'Search an unstructured space by repeatedly amplifying the amplitude of marked answers.', goal: 'Grover’s algorithm finds an item recognized by an oracle. Rather than checking candidates one by one, it rotates probability amplitude toward the marked state.', steps: ['Prepare an equal superposition over all candidate states.', 'Use the oracle to mark the target by changing its phase.', 'Apply the diffusion step, then repeat the mark-and-diffuse pattern an appropriate number of times.'], result: 'A final measurement is likely to return a marked item. The number of iterations is roughly proportional to the square root of the search-space size; too many iterations rotate amplitude away from the target again.' },
  { title: 'Quantum Fourier Transform (QFT)', intro: 'Change from the computational basis to a phase-sensitive frequency basis.', goal: 'The Quantum Fourier Transform is the quantum analogue of a discrete Fourier transform. It reorganizes amplitudes so periodic or phase structure can be read more easily by later steps.', steps: ['Apply H to a qubit to create phase-sensitive interference.', 'Use controlled phase rotations to relate that qubit to later qubits.', 'Repeat across the register, then reverse the qubit order with swaps when needed.'], result: 'QFT is commonly used as a subroutine rather than as a final answer by itself. Its value is in translating hidden periodic structure into measurement probabilities, especially in phase-estimation and factoring ideas.' },
  { title: "Shor's Algorithm", intro: 'Use period finding to turn integer factoring into a problem with quantum and classical parts.', goal: 'Shor’s algorithm factors a composite integer by reducing the hard part to finding the period of modular exponentiation. That period can reveal a nontrivial factor through classical arithmetic.', steps: ['Choose a value a that is coprime to the number being factored.', 'Use a quantum period-finding routine built around modular exponentiation and QFT.', 'Use the measured period in classical calculations to test for factors.'], result: 'Not every choice of a or measured period yields a factor, so the procedure may repeat. The important distinction is that Shor combines a quantum subroutine with classical checks; it is not a single measurement that always prints a factor.' },
  { title: 'VQE – Variational Quantum Eigensolver', intro: 'Use a parameterized circuit and a classical optimizer to estimate a system’s lowest energy.', goal: 'VQE is a hybrid algorithm for estimating an eigenvalue, often the ground-state energy of a quantum system. A tunable circuit prepares candidate states while a classical computer chooses better parameters.', steps: ['Choose an ansatz, a parameterized circuit that can prepare candidate states.', 'Measure the expectation value of the problem Hamiltonian for the current parameters.', 'Use a classical optimizer to update parameters and repeat until the energy stops improving.'], result: 'The lowest measured expectation value is the algorithm’s estimate. VQE is designed with near-term hardware in mind, though accuracy depends on the ansatz, measurements, optimization method, and noise level.' },
  { title: 'QAOA – Quantum Approximate Optimization Algorithm', intro: 'Alternate problem and mixing operations to search for strong solutions to combinatorial problems.', goal: 'QAOA is a hybrid variational method for optimization. It represents the objective as a cost Hamiltonian and uses alternating circuit layers to favor bit strings with good scores.', steps: ['Prepare a balanced starting state over candidate bit strings.', 'Apply a cost layer that encodes the objective, followed by a mixing layer that explores alternatives.', 'Optimize the layer angles classically, then sample bit strings from the best circuit.'], result: 'A high-probability bit string is a candidate solution, which should be evaluated with the original classical objective. More layers can increase expressiveness but also add depth and make optimization harder on noisy devices.' }
];
// These four topics are intentionally not part of the Learn Quantum algorithm sequence.
algorithmTopics.splice(5, 4);

const simulationTopics = [
  { title: 'Introduction to Quantum Simulation', intro: 'Learn what a quantum simulator represents, what it can predict, and why it is useful before using quantum hardware.', body: `<div class="qubit-section"><h2>A model of a quantum experiment</h2><p>A quantum simulator is ordinary software that follows the mathematical rules of a quantum system. It begins with qubits, applies the gates in a circuit, and reports the state or the measurement outcomes the ideal circuit predicts.</p><p>For example, a simulator can prepare <strong>|0&gt;</strong>, apply a Hadamard gate, and show the state <strong>|+&gt; = (|0&gt; + |1&gt;) / sqrt(2)</strong>. This tells us that repeated measurements should produce 0 and 1 with equal probability.</p></div><div class="qubit-section"><h2>Why simulate first?</h2><p>Simulation is a safe place to check a circuit, build intuition, and compare an expected result with actual hardware results. An ideal simulator has no noise unless we deliberately add a noise model, so it gives a useful baseline rather than a guarantee about a physical machine.</p></div>` },
  { title: 'How Quantum Simulators Work', intro: 'Follow the simple loop a simulator uses to turn a circuit description into predicted quantum results.', body: `<div class="qubit-section"><h2>Represent, evolve, inspect</h2><p>Most simulators store a mathematical description of the current quantum state. Each gate is represented by a unitary operation U, and applying that gate updates the state:</p><div class="qubit-equation">|psi'&gt; = U |psi&gt;</div><p>The simulator repeats this update from left to right through the circuit. A two-qubit circuit has four basis states—|00&gt;, |01&gt;, |10&gt;, and |11&gt;—so its state needs four amplitudes.</p></div><div class="qubit-section"><h2>A small example</h2><p>Start with |00&gt;. Apply H to the first qubit, then CNOT with that qubit as control. An ideal simulator produces the Bell state <strong>(|00&gt; + |11&gt;) / sqrt(2)</strong>. Its amplitudes reveal the correlation before any measurement is sampled.</p></div>` },
  { title: 'State-Vector Simulation', intro: 'Use a state vector to inspect the complete ideal quantum state before measurement.', body: `<div class="qubit-section"><h2>One amplitude for each basis state</h2><p>A state-vector simulator stores the complex amplitude for every possible bit string. For n qubits, that means <strong>2^n</strong> amplitudes. A one-qubit state is written as:</p><div class="qubit-equation">|psi&gt; = alpha|0&gt; + beta|1&gt;, &nbsp; |alpha|^2 + |beta|^2 = 1</div><p>The probability of observing a basis state is the squared magnitude of its amplitude. The statevector for |+&gt; is [1/sqrt(2), 1/sqrt(2)], so both outcomes have probability 1/2.</p></div><div class="qubit-section"><h2>Powerful, but costly</h2><p>Statevectors are excellent for learning and debugging because they expose amplitudes and relative phases. Their size doubles whenever one more qubit is added, however: 30 qubits already require more than one billion amplitudes. This exponential growth is why classical simulation eventually becomes expensive.</p></div>` },
  { title: 'Quantum Circuit Simulation', intro: 'Simulate a circuit gate by gate and connect its diagram to the state changes it produces.', body: `<div class="qubit-section"><h2>Circuits are execution plans</h2><p>A circuit simulator reads each wire and gate in order. Gates acting on different qubits can be part of the same layer, while a controlled gate updates the joint state of its qubits. Measurement is normally placed at the end because it turns quantum amplitudes into classical outcomes.</p><div class="circuit-sketch"><div>q0: |0&gt; -- H -- * -- M</div><div>q1: |0&gt; ----- X -- M</div></div></div><div class="qubit-section"><h2>From diagram to prediction</h2><p>For the circuit above, H creates an equal superposition on q0 and the controlled operation creates entanglement. An ideal run predicts only 00 and 11, each with probability 50%. If 01 or 10 appear in a noiseless simulation, the circuit or measurement mapping should be checked.</p></div>` },
  { title: 'Measurement & Sampling', intro: 'Understand why a quantum measurement is probabilistic and why simulators often run many shots.', body: `<div class="qubit-section"><h2>Probabilities are not counts</h2><p>A statevector gives exact ideal probabilities. A sampled simulation performs individual measurements, often called <strong>shots</strong>, and returns counts. If P(0) = P(1) = 1/2, 100 shots might return 47 zeros and 53 ones; that small difference is ordinary sampling variation.</p><div class="qubit-equation">P(x) = |amplitude(x)|^2</div></div><div class="qubit-section"><h2>Reading a result</h2><p>Use more shots when you need a steadier estimate, but remember that sampling cannot reveal a hidden phase directly. Compare counts with the probability distribution predicted by the circuit. For a Bell-state example, the useful pattern is correlated outcomes, not necessarily exactly equal counts.</p></div>` },
  { title: 'Sia & HDQS Quantum Simulation', intro: 'Use Sia and HDQS as tools for building, simulating, and inspecting small quantum circuits.', body: `<div class="qubit-section"><h2>A practical workflow</h2><p>Sia and HDQS can be used to describe a circuit, choose an initial state, apply gates, and inspect a simulated result. A helpful learning loop is: predict the result on paper, build the smallest circuit that tests it, then compare the simulator output with the prediction.</p></div><div class="qubit-section"><h2>Start with explainable experiments</h2><p>Begin with familiar cases: apply X to |0&gt; and expect |1&gt;; apply H to |0&gt; and expect balanced measurement statistics; apply H followed by CNOT to |00&gt; and expect correlated results. Keep the circuit small, record the number of shots, and separate ideal state inspection from sampled measurement results.</p><p>As circuits grow, the same habits still help: verify one layer at a time, state what result you expect, and use the simulator to find where a prediction and a circuit disagree.</p></div>` }
];
const simulationLessonBodies = [
  `<div class="qubit-section"><h2>Purpose and uses</h2><p>A quantum simulator is a classical program that follows quantum mathematics. It prepares qubits, applies gates, and predicts either an ideal state or measurement results. Simulators help learners build intuition, let developers test circuits before execution, and support small models in chemistry, materials, optimisation, and research.</p><p>For example, H applied to |0&gt; prepares <strong>|+&gt; = (|0&gt; + |1&gt;) / sqrt(2)</strong>, so the ideal probabilities are 50% for 0 and 50% for 1.</p></div><div class="qubit-section"><h2>Benefits and limitations</h2><div class="comparison-grid"><div><strong>Classical simulation</strong><span>Repeatable, inexpensive for small circuits, and able to reveal an ideal statevector.</span></div><div><strong>Real quantum hardware</strong><span>Uses physical qubits, returns measurements, and is affected by noise and calibration.</span></div></div><p>An ideal simulation omits noise unless a noise model is selected. It is a baseline, not proof that a circuit will perform identically on hardware. Exact simulation also becomes costly as the number of qubits grows.</p></div>`,
  `<div class="qubit-section"><h2>Representing a quantum state</h2><p>A software qubit is represented with complex amplitudes for basis states. One qubit uses |0&gt; and |1&gt;; two qubits use |00&gt;, |01&gt;, |10&gt;, and |11&gt;. An amplitude becomes a probability only after taking its squared magnitude.</p><div class="qubit-equation">|psi'&gt; = U|psi&gt;, &nbsp; P(x) = |amplitude(x)|<sup>2</sup></div></div><div class="qubit-section"><h2>The simulation loop</h2><ol><li>Initialize, usually in |00...0&gt;.</li><li>Represent each gate as an operation U.</li><li>Update the state in circuit order.</li><li>Measure to obtain probabilities or sampled results.</li></ol><p>Starting at |00&gt;, H on q0 makes (|00&gt; + |10&gt;) / sqrt(2). CNOT from q0 to q1 then makes (|00&gt; + |11&gt;) / sqrt(2). The simulator evolves the state before measurement.</p></div>`,
  `<div class="qubit-section"><h2>Basis states, amplitudes, and normalization</h2><p>The statevectors |0&gt; = [1, 0] and |1&gt; = [0, 1] describe the computational basis. A general qubit is:</p><div class="qubit-equation">|psi&gt; = alpha|0&gt; + beta|1&gt;, &nbsp; |alpha|<sup>2</sup> + |beta|<sup>2</sup> = 1</div><p>The normalization rule ensures that some measurement outcome has total probability one. H|0&gt; = (|0&gt; + |1&gt;) / sqrt(2), with amplitudes 0.707... and 0.707..., therefore P(0) = P(1) = 1/2.</p></div><div class="qubit-section"><h2>The 2<sup>n</sup> cost</h2><p>An exact n-qubit statevector needs one amplitude for each of 2<sup>n</sup> basis states. Each extra qubit doubles memory: 20 qubits require 1,048,576 amplitudes, while 30 require more than one billion. Statevectors are excellent for small circuits and debugging, but this scaling limits classical memory and runtime.</p></div>`,
  `<div class="qubit-section"><h2>Executing a circuit</h2><p>A circuit simulator reads wires and gates from left to right. Wires are qubits, boxes are operations, and measurement converts a quantum state into classical output. Separate gates can be applied in the same circuit layer; controlled gates operate on the combined state.</p><div class="circuit-sketch"><div>q0: |0&gt; -- H -- ● -- M</div><div>q1: |0&gt; ------- ⊕ -- M</div></div></div><div class="qubit-section"><h2>H + CNOT example</h2><ol><li>Initial state: |00&gt;.</li><li>After H on q0: (|00&gt; + |10&gt;) / sqrt(2).</li><li>After CNOT: (|00&gt; + |11&gt;) / sqrt(2).</li><li>After measurement: 00 or 11, each with probability 1/2.</li></ol><p>This final Bell state is entangled. An ideal simulator should never return 01 or 10; those outcomes would signal a circuit, qubit-order, or measurement-mapping error.</p></div>`,
  `<div class="qubit-section"><h2>Probabilities and one measurement</h2><p>A statevector holds amplitudes, but one measurement returns one basis-state value. For any state x, <strong>P(x) = |amplitude(x)|<sup>2</sup></strong>. The |+&gt; state has equal probabilities, but a single measurement is still either 0 or 1.</p></div><div class="qubit-section"><h2>Shots, samples, and counts</h2><p>A shot is one independent circuit execution and measurement. A shot simulator repeats the experiment and reports counts. For 100 shots of |+&gt;, {0: 47, 1: 53} is a normal result: it estimates, rather than replaces, the ideal 50/50 probability.</p><div class="gate-comparison"><div><strong>Output</strong><strong>What it means</strong><strong>Example</strong></div><div><span>Probability</span><span>Ideal expectation</span><span>P(1) = 0.5</span></div><div><span>Shot</span><span>One observed result</span><span>1</span></div><div><span>Count</span><span>Total over many shots</span><span>{0: 47, 1: 53}</span></div></div><p>More shots usually give steadier frequencies, yet random variation remains. Compare ideal probabilities, sampled counts, and hardware counts separately to distinguish sampling variation from noise or a circuit error.</p></div>`,
  `<div class="qubit-section"><h2>Framework comparison</h2><p>Qiskit with Aer is a general circuit toolkit for statevectors, shots, and noise models. PennyLane is useful for parameterized and hybrid quantum-classical workflows. Cirq is focused on constructing and simulating gate-level circuits. Sia Script with HDQS provides the compact state-inspection workflow used in this guide.</p><div class="gate-comparison"><div><strong>Framework</strong><strong>Good for</strong><strong>Simulation use</strong></div><div><span>Qiskit / Aer</span><span>General circuits</span><span>Statevectors, shots, noise</span></div><div><span>PennyLane</span><span>Hybrid learning</span><span>Parameterized circuits</span></div><div><span>Cirq</span><span>Gate-level circuits</span><span>Circuit construction and simulation</span></div><div><span>Sia Script / HDQS</span><span>Small examples</span><span>Readable state inspection</span></div></div></div><div class="qubit-section"><h2>A documented Sia / HDQS example</h2><div class="code-block">from sia import HDQS<br><br>q = HDQS(1)<br>q.h(0)<br>q.show_state()</div><ul class="code-explanation"><li><strong>from sia import HDQS</strong> imports the simulator interface.</li><li><strong>HDQS(1)</strong> creates one simulated qubit initialized in |0&gt;.</li><li><strong>q.h(0)</strong> applies H, producing an equal superposition.</li><li><strong>q.show_state()</strong> prints amplitudes and their probabilities.</li></ul><p>Expected ideal output is |0&gt; and |1&gt; with amplitudes about 0.707+0.000i and probabilities of 50.0% each.</p></div><div class="qubit-section"><h2>Classical simulation versus a physical run</h2><p>This HDQS example computes a classical ideal simulation; it does not execute on a physical quantum processor. Hardware prepares real qubits and returns sampled measurements that can differ through gate noise, decoherence, readout error, and calibration. Use simulation to form a prediction, then compare it honestly with hardware data.</p></div>`
];
simulationTopics.forEach((topic, index) => { topic.body = simulationLessonBodies[index]; });
simulationTopics[5].title = 'Quantum Simulation Frameworks & Sia/HDQS';
simulationTopics[5].intro = 'Compare quantum simulation frameworks and use a small HDQS state-vector example.';
const simulationLessonExtensions = [
  `<div class="qubit-section"><h2>Why a classical computer can model a quantum system</h2><p>A classical computer does not become quantum while it simulates. Instead, it stores a list of numbers that stand for the amplitudes of all possible measurement outcomes, then applies the same linear-algebra rules used by quantum mechanics. For a small system this is very effective: the simulator can calculate what an ideal quantum device would predict without needing access to a quantum processor.</p><p>This distinction matters. Simulation is a way to <em>calculate a model</em> of quantum behaviour; hardware is a physical experiment that must protect delicate quantum states from their environment.</p></div><div class="qubit-section"><h2>Where simulation is most useful</h2><div class="comparison-grid"><div><strong>Learning</strong><span>Connect a circuit diagram to amplitudes, probabilities, and measurement outcomes.</span></div><div><strong>Debugging</strong><span>Inspect an expected state after each important circuit layer.</span></div><div><strong>Algorithm design</strong><span>Compare circuit choices, depth, and ideal measurement distributions.</span></div><div><strong>Noise studies</strong><span>Estimate how selected error models may change a circuit's results.</span></div></div><p>Simulation is especially useful before a hardware run because it gives a precise prediction to compare against. If the hardware result differs, investigate whether the difference comes from shot variation, compilation changes, or physical noise.</p></div><div class="qubit-section"><h2>An honest mental model</h2><p>A simulator is not a shortcut around quantum computing's hard problems. Exact classical simulation has to track an exponentially growing state as qubits become entangled. That is precisely why quantum systems may be useful for some tasks: their full state can be difficult for an ordinary computer to store and evolve.</p></div>`,
  `<div class="qubit-section"><h2>Basis-state bookkeeping</h2><p>For n qubits, the simulator chooses an ordering for the 2<sup>n</sup> basis strings and stores one amplitude for each one. For two qubits, a common ordering is |00&gt;, |01&gt;, |10&gt;, |11&gt;. The all-zero initial state is therefore [1, 0, 0, 0]. A simulator must use a consistent qubit-order convention; otherwise a correct-looking circuit can be interpreted incorrectly.</p></div><div class="qubit-section"><h2>Gates change amplitudes, not measured bits</h2><p>Before measurement, a gate is an operation on amplitudes. A Hadamard redistributes amplitudes; Z changes a relative phase; CNOT conditionally rearranges amplitudes across two qubits. In matrix language, a valid ideal gate is unitary:</p><div class="qubit-equation">U<sup>dagger</sup>U = I</div><p>This preserves normalization, so the total measurement probability remains one. The simulator applies operations in circuit order, even though the matrix expression for several gates may be written as one combined transformation.</p></div><div class="qubit-section"><h2>Complete workflow</h2><ol><li>Define the number of qubits and any classical measurement bits.</li><li>Build a circuit from initialization, gates, and measurements.</li><li>Select a simulation mode: exact statevector, shot sampling, or a selected noise model.</li><li>Execute and inspect amplitudes, probabilities, or counts.</li><li>Compare the result with a prediction, then revise only one part of the circuit at a time.</li></ol><p>This workflow turns simulation into an experiment with a stated expectation, rather than a black box that merely prints output.</p></div>`,
  `<div class="qubit-section"><h2>Single-qubit examples</h2><div class="gate-comparison"><div><strong>State</strong><strong>Statevector</strong><strong>Measurement probabilities</strong></div><div><span>|0&gt;</span><span>[1, 0]</span><span>P(0)=1, P(1)=0</span></div><div><span>|1&gt;</span><span>[0, 1]</span><span>P(0)=0, P(1)=1</span></div><div><span>|+&gt;</span><span>[1/sqrt(2), 1/sqrt(2)]</span><span>P(0)=P(1)=1/2</span></div><div><span>|-&gt;</span><span>[1/sqrt(2), -1/sqrt(2)]</span><span>P(0)=P(1)=1/2</span></div></div><p>|+&gt; and |-&gt; have the same immediate computational-basis probabilities, but they are different states. Applying H again maps |+&gt; to |0&gt; and |-&gt; to |1&gt;. This is a useful demonstration that relative phase affects interference.</p></div><div class="qubit-section"><h2>Multiple qubits and tensor products</h2><p>Independent systems combine with a tensor product. For example, |0&gt; tensor |1&gt; = |01&gt;, represented by [0, 1, 0, 0] in the ordering used above. A two-qubit product state can be described as two separate single-qubit states. An entangled state cannot: the Bell state <strong>(|00&gt; + |11&gt;) / sqrt(2)</strong> must be represented as one joint statevector.</p><div class="qubit-equation">|0&gt; tensor |1&gt; = |01&gt;</div></div><div class="qubit-section"><h2>Memory in practical terms</h2><p>Statevector entries are usually complex floating-point numbers. The 2<sup>n</sup> growth means memory rises quickly: a rough double-precision estimate is 16 bytes per amplitude, before overhead. That is about 16 MiB for 20 qubits, 16 GiB for 30 qubits, and roughly 16 TiB for 40 qubits. Special-purpose simulators can exploit circuit structure in some cases, but no general method removes the exponential worst case.</p></div>`,
  `<div class="qubit-section"><h2>Registers and circuit layers</h2><p>A register is simply a named collection of qubits. A circuit may also include classical bits that store measurement results. Reading a circuit left to right, a simulator groups compatible gates into layers when possible, while preserving every dependency. The diagram is not just decoration: it is an execution plan that says which operation affects which part of the joint state.</p></div><div class="qubit-section"><h2>Trace a one-qubit circuit</h2><p>Consider |0&gt; followed by X, then H. X changes |0&gt; to |1&gt;. H then produces <strong>(|0&gt; - |1&gt;) / sqrt(2)</strong>. A statevector simulator displays the minus sign; a shot simulator reports near-equal 0 and 1 counts. Both views are correct, but only the statevector exposes the phase that a later gate could use.</p></div><div class="qubit-section"><h2>How a simulator processes a circuit</h2><ol><li>Allocate a state representation for the register.</li><li>Apply the first gate to the affected amplitudes.</li><li>Apply each next gate to the updated state, including multi-qubit gates.</li><li>Stop at measurement instructions and convert the selected amplitudes into probabilities.</li><li>Return the exact state or sample the requested number of shots.</li></ol><p>For larger circuits, the simulator may use optimized matrix operations, tensor networks, or stabilizer methods. These are different classical techniques for calculating a circuit; they do not change the circuit's intended quantum result.</p></div>`,
  `<div class="qubit-section"><h2>Measurement is a basis-dependent question</h2><p>The usual computational-basis measurement asks whether each qubit is 0 or 1. A state that looks balanced in that basis can be definite in another basis. For instance, |+&gt; gives 0 or 1 with equal probability in the computational basis, but applying H before measurement changes the basis and makes the result 0 with certainty.</p><p>Measurement also changes the state in an ideal projective model. Once |+&gt; is measured as 0, an immediate repeat gives 0 again unless a new gate changes the qubit.</p></div><div class="qubit-section"><h2>Distribution example: a Bell state</h2><p>For (|00&gt; + |11&gt;) / sqrt(2), the ideal distribution is:</p><div class="gate-comparison"><div><strong>Bit string</strong><strong>Probability</strong><strong>Expected count in 1,000 shots</strong></div><div><span>00</span><span>0.5</span><span>about 500</span></div><div><span>11</span><span>0.5</span><span>about 500</span></div><div><span>01 or 10</span><span>0</span><span>0 in an ideal simulation</span></div></div><p>One thousand shots will rarely give exactly 500 and 500. The observed fraction approaches the probability as shots increase, but every finite experiment contains statistical variation.</p></div><div class="qubit-section"><h2>Interpreting counts carefully</h2><p>Counts are evidence about a distribution, not a complete description of the state. They do not reveal global phase, and they can hide a circuit error if the wrong measurement basis is used. First predict the pattern; then ask whether the counts support that pattern within normal sampling variation. On hardware, also account for readout and gate errors.</p></div>`,
  `<div class="qubit-section"><h2>Choosing a framework</h2><p>There is no single best framework. Choose one based on the question you need to answer. Qiskit/Aer is a broad option for circuit construction, simulator backends, and noise experiments. PennyLane is designed around hybrid workflows where a classical optimiser updates circuit parameters. Cirq is well suited to explicit gate-level circuit construction and simulation. Sia Script/HDQS is useful in this guide for direct, readable experiments that expose a small system's state.</p></div><div class="qubit-section"><h2>What the tools have in common</h2><p>All of these tools can describe qubits, add gates, execute a classical simulation, and inspect results. Their syntax and workflow differ, but the underlying concepts do not: an initial state evolves under operations, then a measurement produces probabilities or samples. A framework is an interface to the model; it is not itself a quantum computer.</p></div><div class="qubit-section"><h2>From state inspection to samples in HDQS</h2><p>Use <strong>q.show_state()</strong> when learning what amplitudes the circuit has prepared. It is especially helpful after H, phase gates, or controlled gates, because it makes the ideal state visible. Sampling instead means repeating a measurement procedure to build counts. Keep those two questions separate: “What ideal state did this circuit create?” and “What outcomes appear across repeated measurements?”</p><p>For the displayed H example, the state inspection reports both basis states at 50%. A physical processor would not reveal both amplitudes directly; it would return one measured value per run. That contrast is one of simulation's strongest educational benefits and one of the reasons it must not be confused with hardware execution.</p></div><div class="qubit-section"><h2>Expected HDQS state output</h2><div class="code-block">H(0)<br>State &nbsp; Amplitude &nbsp; Prob<br>---------------------------------------<br>|0&gt; &nbsp; 0.707+0.000i &nbsp; 50.0%<br>|1&gt; &nbsp; 0.707+0.000i &nbsp; 50.0%</div><p>Both amplitudes have magnitude about 0.707 = 1/sqrt(2). Squaring that magnitude gives 0.5, which explains the two 50.0% probabilities.</p></div>`
];
simulationTopics.forEach((topic, index) => { topic.body += simulationLessonExtensions[index]; });
const frameworkTopics = [
  { title: 'Introduction', intro: 'Meet the software tools that turn a circuit idea into a runnable experiment.', body: `<div class="qubit-section"><h2>What a quantum framework does</h2><p>A quantum framework is a software toolkit for describing circuits, choosing a simulator or hardware backend, running an experiment, and interpreting the result. It gives programmers a practical bridge between a circuit diagram and executable instructions.</p><div class="state-flow math-flow"><span>Problem idea</span><b>→</b><strong>Circuit program</strong><b>→</b><span>Simulator or device</span><b>→</b><strong>Results</strong></div><p>Frameworks do not change the rules of quantum mechanics. They help organize the work around those rules: registers, operations, compilation, execution, and result analysis.</p></div><div class="qubit-section"><h2>A useful workflow</h2><ol><li>Write the smallest circuit that represents the task.</li><li>Run it on a simulator and state what result you expect.</li><li>Inspect the circuit and measurements.</li><li>Choose a backend and compile for its available operations.</li><li>Compare results, including any difference between ideal simulation and hardware.</li></ol><p>Each framework has its own syntax, but this workflow remains familiar across tools.</p></div><aside class="key-idea"><span class="card-label">Key idea</span><p>Choose a framework for the kind of work you want to do: general circuit experiments, hardware-oriented construction, hybrid optimisation, or SIA-specific learning workflows.</p></aside>` },
  { title: 'Qiskit', intro: 'Explore Qiskit as a Python toolkit for building circuits, running simulations, and working with quantum backends.', body: `<div class="qubit-section"><h2>Qiskit in practice</h2><p>Qiskit is a Python-based quantum software toolkit. A typical program creates a circuit, adds gates and measurements, then runs that circuit through a simulator or a selected backend. Its ecosystem is commonly used for teaching, circuit experiments, and hardware-aware workflows.</p><div class="code-block">from qiskit import QuantumCircuit<br><br>circuit = QuantumCircuit(1, 1)<br>circuit.h(0)<br>circuit.measure(0, 0)</div><p>This small circuit prepares an equal superposition and records one classical measurement bit. A shot-based execution should produce roughly balanced 0 and 1 counts.</p></div><div class="qubit-section"><h2>Transpilation and backends</h2><p>A high-level circuit is not always directly executable on a target backend. Transpilation rewrites it into supported gates and connections while aiming to preserve its meaning. This is where practical constraints such as available gate sets, qubit layout, and circuit depth become visible.</p><p>Use an ideal simulator to understand the intended circuit, then examine any compiled version before interpreting a hardware result.</p></div>` },
  { title: 'Cirq & PennyLane', intro: 'Compare a circuit-focused framework with a hybrid quantum-classical framework.', body: `<div class="qubit-section"><h2>Cirq: explicit circuit construction</h2><p>Cirq is a Python framework focused on representing circuits in terms of qubits, moments, and operations. It is particularly useful when you want to see a circuit's gate-level structure clearly and simulate that structure directly.</p><div class="code-block">import cirq<br><br>q = cirq.LineQubit(0)<br>circuit = cirq.Circuit(cirq.H(q))</div><p>Its circuit-first style makes it natural to inspect which operation is applied to which qubit at each point in the program.</p></div><div class="qubit-section"><h2>PennyLane: hybrid workflows</h2><p>PennyLane is designed for quantum programs whose parameters are adjusted by a classical optimiser. This is helpful for variational workflows, where a circuit produces a value and a classical loop updates angles to improve that value.</p><div class="code-block">import pennylane as qml<br><br>device = qml.device('default.qubit', wires=1)<br>@qml.qnode(device)<br>def experiment():<br>&nbsp;&nbsp;qml.Hadamard(wires=0)<br>&nbsp;&nbsp;return qml.expval(qml.Z(0))</div><p>Cirq emphasizes the circuit structure; PennyLane emphasizes circuits as parts of a larger differentiable or hybrid program. Both can be used with simulators before a hardware run.</p></div>` },
  { title: 'Q#', intro: 'Learn how Q# approaches quantum programming as a language designed for quantum operations and algorithms.', body: `<div class="qubit-section"><h2>A language for quantum programs</h2><p>Q# is a quantum programming language in the Microsoft quantum development ecosystem. It is designed to express quantum operations, allocate qubits, and combine classical control with quantum instructions in one program.</p><p>A Q# program separates the classical host logic from the quantum operations it calls. This makes it useful for expressing larger algorithmic workflows while keeping quantum steps explicit.</p></div><div class="qubit-section"><h2>Operations and measurement</h2><div class="code-block">operation PrepareAndMeasure() : Result {<br>&nbsp;&nbsp;use q = Qubit();<br>&nbsp;&nbsp;H(q);<br>&nbsp;&nbsp;return M(q);<br>}</div><p>This conceptual example allocates one qubit, applies H, and measures it. Repeated runs produce either result with equal ideal probability. The value of the example is the program structure: allocation, operation, and measurement are written as named quantum steps.</p></div><div class="qubit-section"><h2>When Q# fits</h2><p>Q# is a good option when you want language-level support for quantum routines and close integration with a broader development workflow. As with other frameworks, a simulator is valuable for testing assumptions before a circuit is executed on physical hardware.</p></div>` },
  { title: 'SIA Script + HDQS', intro: 'Use SIA Script and HDQS to write small, readable quantum experiments and inspect their simulated states.', body: `<div class="qubit-section"><h2>The SIA-specific workflow</h2><p>SIA Script with HDQS keeps a beginner experiment compact: create an HDQS system, apply named gates, then inspect the state. This makes it useful for connecting a short program directly to amplitudes and probabilities.</p><div class="code-block">from sia import HDQS<br><br>q = HDQS(2)<br>q.h(0)<br>q.cnot(0, 1)<br>q.show_state()</div></div><div class="qubit-section"><h2>Read every line</h2><ul class="code-explanation"><li><strong>from sia import HDQS</strong> imports the HDQS quantum simulation interface.</li><li><strong>HDQS(2)</strong> creates a two-qubit system initialized in |00&gt;.</li><li><strong>q.h(0)</strong> creates equal amplitudes on the control qubit.</li><li><strong>q.cnot(0, 1)</strong> correlates the target with that control.</li><li><strong>q.show_state()</strong> displays the ideal amplitudes and probabilities.</li></ul><p>The expected ideal state is <strong>(|00&gt; + |11&gt;) / sqrt(2)</strong>, so |00&gt; and |11&gt; each have 50% probability. State inspection is a software-simulation feature: a physical processor would return sampled measurements, not reveal its complete statevector.</p></div><div class="qubit-section"><h2>Build reliable SIA experiments</h2><p>Use one gate at a time, predict the result before running, and check the state after meaningful milestones. Start with X, H, and CNOT patterns; then extend a verified small circuit instead of guessing at a larger one. This keeps SIA code readable and makes disagreements between prediction and output easier to diagnose.</p></div>` },
  { title: 'Framework Comparison', intro: 'Choose a quantum framework by matching its strengths to the experiment you want to run.', body: `<div class="qubit-section"><h2>A practical comparison</h2><div class="gate-comparison"><div><strong>Framework</strong><strong>Best fit</strong><strong>Typical simulation use</strong></div><div><span>Qiskit / Aer</span><span>General Python workflows</span><span>Circuits, sampling, noise, backends</span></div><div><span>Cirq</span><span>Gate-level circuit work</span><span>Explicit operations and circuit structure</span></div><div><span>PennyLane</span><span>Hybrid optimisation</span><span>Parameterized circuits and expectations</span></div><div><span>Q#</span><span>Language-level quantum routines</span><span>Program structure and quantum operations</span></div><div><span>SIA Script / HDQS</span><span>Guided learning experiments</span><span>Compact circuits and state inspection</span></div></div></div><div class="qubit-section"><h2>Questions to ask before choosing</h2><ul><li>Do I need a simple circuit demonstration, a hybrid optimisation loop, or a larger program structure?</li><li>Do I want exact state inspection, sampled counts, noise modelling, or hardware execution?</li><li>Can I explain the expected result before I run the program?</li><li>Does the target framework make the circuit and measurement mapping easy to review?</li></ul><p>Framework choice is an engineering decision, not a test of quantum knowledge. The best first tool is the one that keeps the experiment understandable, inspectable, and small enough to verify.</p></div><aside class="key-idea"><span class="card-label">Key takeaway</span><p>Different frameworks expose the same core workflow in different ways. Learn one carefully, then transfer the circuit, simulation, and measurement habits to the next.</p></aside>` }
];
frameworkTopics[0].title = 'Introduction to Quantum Frameworks';
frameworkTopics[0].body += `<div class="qubit-section"><h2>Why developers need frameworks</h2><p>A framework removes the low-level work of translating a circuit idea into executable instructions. It provides familiar programming structures for declaring qubits, adding gates, arranging operations into circuits, choosing measurements, and collecting results. This lets developers focus on the problem and still inspect every important part of the experiment.</p><div class="comparison-grid"><div><strong>Build</strong><span>Create qubits, gates, registers, and measurements as readable program objects.</span></div><div><strong>Simulate</strong><span>Check the ideal state or sampled outcomes before using a device.</span></div><div><strong>Execute</strong><span>Send a compiled circuit to a compatible simulator or hardware backend.</span></div><div><strong>Analyse</strong><span>Read counts, probabilities, errors, and circuit details to test a prediction.</span></div></div></div><div class="qubit-section"><h2>The common building blocks</h2><p>Across frameworks, a <strong>qubit</strong> is the unit a circuit acts on; a <strong>gate</strong> is an instruction; a <strong>circuit</strong> is their ordered plan; and <strong>measurement</strong> converts selected qubits into ordinary data. A <strong>simulator</strong> calculates a model on classical infrastructure, while a <strong>backend</strong> is the chosen place to run the circuit, such as a simulator or a physical quantum processor.</p></div><div class="qubit-section"><h2>From idea to result</h2><div class="state-flow math-flow"><strong>Quantum Algorithm</strong><b>→</b><span>Framework</span><b>→</b><strong>Quantum Circuit</strong><b>→</b><span>Simulator / Backend</span><b>→</b><strong>Measurement</strong><b>→</b><span>Results</span></div><p>The framework helps at each hand-off: it expresses the algorithm as a circuit, prepares it for the selected backend, and returns data that can be compared with the expected pattern.</p></div><div class="qubit-section"><h2>Frameworks at a glance</h2><p><strong>Qiskit</strong> offers general Python circuit workflows and backends. <strong>Cirq</strong> emphasizes explicit gate-level circuit construction. <strong>PennyLane</strong> supports hybrid programs with adjustable circuit parameters. <strong>Q#</strong> presents quantum operations in a dedicated language. <strong>SIA Script + HDQS</strong> provides concise, state-inspection examples used throughout this guide. The following pages introduce each tool in its own context.</p></div>`;
const frameworkLessonExtensions = [
  `<div class="qubit-section"><h2>One workflow, different interfaces</h2><p>Every framework ultimately helps with the same hand-offs: express an idea as operations, choose where it runs, and inspect the returned data. The details differ—some emphasize Python circuits, some hybrid optimization, some a dedicated language—but a good first habit is universal: write a prediction before executing.</p></div>`,
  `<div class="qubit-section"><h2>The Qiskit workflow</h2><div class="state-flow math-flow"><span>QuantumCircuit</span><b>→</b><strong>Measure</strong><b>→</b><span>Transpile</span><b>→</b><strong>Backend</strong><b>→</b><span>Counts</span></div><p>In Qiskit, a circuit object captures the intended operations. Measurement maps qubits to classical bits. Before execution, transpilation adapts the circuit to a backend's supported operations and layout. Finally, a simulator or device returns counts or other selected result data.</p></div><div class="qubit-section"><h2>Good Qiskit habits</h2><ul><li>Draw or inspect the circuit before running it.</li><li>Keep the initial example small enough to predict by hand.</li><li>Use a simulator first, then compare the compiled circuit with the original.</li><li>Record shot count and qubit-to-classical-bit measurement mapping when reading counts.</li></ul><p>These habits help distinguish a programming mistake from a result that is simply affected by sampling or hardware noise.</p></div>`,
  `<div class="qubit-section"><h2>Different starting points</h2><div class="gate-comparison"><div><strong>Question</strong><strong>Cirq approach</strong><strong>PennyLane approach</strong></div><div><span>What is the circuit?</span><span>Make its operations and moments explicit.</span><span>Define a quantum function on a chosen device.</span></div><div><span>What is returned?</span><span>Simulated state or measurement results.</span><span>Expectation, sample, probability, or differentiable value.</span></div><div><span>When is it useful?</span><span>Gate-level circuit inspection.</span><span>Hybrid parameter optimisation.</span></div></div></div><div class="qubit-section"><h2>Practical context</h2><p>Use Cirq when the sequence and placement of operations is the main thing you want to reason about. Use PennyLane when the circuit sits inside a classical feedback loop, such as changing a rotation angle to improve a measured objective. Both still require the same discipline: know what measurement quantity is being requested and what result pattern would support the intended circuit.</p></div>`,
  `<div class="qubit-section"><h2>Microsoft's approach</h2><p>Q# treats quantum operations as first-class program units. This encourages code that names a reusable quantum routine, specifies its inputs and outputs, and keeps the surrounding classical control explicit. It is useful when an experiment is more than one anonymous circuit and needs clear program structure.</p></div><div class="qubit-section"><h2>Simulator before hardware</h2><p>A Q# routine can be tested against a simulator to verify its logical behavior. A physical backend introduces a separate engineering question: what operations, connectivity, and noise characteristics does that backend have? Keeping algorithm intent, simulator validation, and hardware execution as separate steps makes the workflow easier to audit.</p></div>`,
  `<div class="qubit-section"><h2>Expected HDQS result</h2><div class="code-block">H(0)<br>CNOT(0,1)<br>State &nbsp; Amplitude &nbsp; Prob<br>---------------------------------------<br>|00&gt; &nbsp; 0.707+0.000i &nbsp; 50.0%<br>|11&gt; &nbsp; 0.707+0.000i &nbsp; 50.0%</div><p>The output says the simulator holds two equally weighted joint basis states. It does not mean one hardware measurement returns both values. A hardware run would sample either 00 or 11 on each shot, and repeated runs would build a count distribution.</p></div><div class="qubit-section"><h2>From a verified example to a larger program</h2><ol><li>Run the smallest state-inspection example and explain every listed amplitude.</li><li>Add one gate or measurement choice at a time.</li><li>State the new expected pattern before running again.</li><li>Keep the code, output, and interpretation together when documenting the experiment.</li></ol><p>This SIA-specific loop is deliberately simple: it turns HDQS into a tool for checking a claim, not merely producing output.</p></div>`,
  `<div class="qubit-section"><h2>Qiskit and SIA Script + HDQS</h2><div class="gate-comparison"><div><strong>Aspect</strong><strong>Qiskit</strong><strong>SIA Script + HDQS</strong></div><div><span>Main style</span><span>General Python quantum workflow</span><span>Compact guided quantum experiments</span></div><div><span>Typical focus</span><span>Circuits, backends, transpilation</span><span>Readable gates and state inspection</span></div><div><span>Best first task</span><span>Build and measure a small circuit</span><span>Inspect a small circuit's amplitudes</span></div><div><span>Shared habit</span><span colspan="2">Predict the measurement pattern before execution.</span></div></div><p>Neither tool is “more quantum” than the other. They make different trade-offs in workflow and presentation. Choose the one that makes your current experiment easiest to explain, verify, and extend.</p></div><div class="qubit-section"><h2>Simulator or real backend?</h2><p>Across every framework, a simulator runs classical software that models a circuit. A real backend operates physical qubits and returns samples influenced by device conditions. Use simulation to establish an ideal reference; use a real backend when the experiment requires evidence from a physical quantum system.</p></div>`
];
frameworkTopics.forEach((topic, index) => { topic.body += frameworkLessonExtensions[index]; });
const applicationTopics = [
  { title: 'Quantum Cryptography', intro: 'Learn how quantum physics can help two parties establish a shared secret and detect eavesdropping.', body: `<div class="qubit-section"><h2>Introduction</h2><p>Quantum cryptography uses properties of quantum states to protect communication tasks. Its best-known application is <strong>quantum key distribution</strong> (QKD), which helps two parties create matching random secret keys while detecting whether a channel may have been observed.</p><p>QKD does not replace ordinary encryption. After a key is established, conventional symmetric encryption still protects the message data.</p></div><div class="qubit-section"><h2>Core concepts</h2><ul class="hardware-list"><li><strong>QKD:</strong> a method for establishing shared secret key material.</li><li><strong>No-cloning:</strong> an unknown quantum state cannot be copied perfectly.</li><li><strong>Measurement disturbance:</strong> measuring a state in an unsuitable or unknown basis can change it.</li><li><strong>Basis:</strong> a choice of how a quantum state is prepared or measured.</li></ul><p>These ideas make eavesdropping detectable in principle: an interceptor cannot reliably read and resend every unknown quantum state without leaving errors for the legitimate parties to test.</p></div><div class="qubit-section"><h2>How it works</h2><div class="state-flow math-flow"><span>Prepare random states</span><b>→</b><strong>Measure</strong><b>→</b><span>Compare bases</span><b>→</b><strong>Check errors</strong><b>→</b><span>Shared key</span></div><p>A sender, often called Alice, chooses random bits and random bases to prepare quantum states. A receiver, Bob, measures each state using independently random bases. They publicly compare their basis choices, keep only results made with matching bases, and reveal a small sample to estimate the error rate.</p><p>If the sample error is acceptable, they use classical error correction to reconcile differences and privacy amplification to shorten the shared string into a key with reduced information leakage.</p></div><div class="qubit-section"><h2>Important protocols</h2><div class="gate-comparison"><div><strong>Protocol</strong><strong>Main idea</strong><strong>What students should notice</strong></div><div><span>BB84</span><span>Uses two incompatible preparation and measurement bases.</span><span>Incorrect-basis measurements create random outcomes and expose interception statistically.</span></div><div><span>E91</span><span>Uses entangled particle pairs and correlated measurements.</span><span>Security tests can be related to the strength of quantum correlations.</span></div></div><p>BB84 is a useful first protocol because a matching basis can preserve a bit, while a mismatched basis produces a result that must be discarded. E91 highlights that entanglement can also support key-distribution protocols.</p></div><div class="qubit-section"><h2>Simple example</h2><p>Suppose Alice encodes bit 1 in one basis and Bob happens to measure in that same basis. Bob can recover 1, so the pair may keep that result. If Bob uses the other basis, his outcome is not reliably related to Alice's bit; after comparing bases, they discard it.</p><p>An eavesdropper who guesses the wrong basis sometimes changes a state. When Alice and Bob later test a subset of retained bits, those extra mismatches raise the observed error rate.</p></div><div class="qubit-section"><h2>Real-world applications</h2><p>QKD is explored for highly sensitive links, including connections between data centers, government or research networks, financial infrastructure, and critical systems. It can be carried over specialized optical links or, in some designs, free-space optical channels.</p><p>It is one component of a complete security system: authentication, endpoint security, key management, and conventional encryption remain necessary.</p></div><div class="qubit-section"><h2>Challenges and limitations</h2><p>Real devices have loss, detector imperfections, finite-key effects, and implementation vulnerabilities. QKD also needs an authenticated classical channel, and its distance, key rate, hardware cost, and operational complexity must be evaluated for the actual deployment.</p></div><aside class="key-idea"><span class="card-label">Key takeaway</span><p>QKD uses no-cloning and measurement disturbance to establish keys and test for interference. It strengthens key exchange; it does not eliminate the need for well-designed classical security.</p></aside>` },
  { title: 'Post-Quantum Cryptography', intro: 'Understand why some public-key systems face quantum threats and how lattice-based standards prepare for them.', body: `<div class="qubit-section"><h2>Introduction</h2><p><strong>Post-quantum cryptography</strong> (PQC) is classical cryptography designed to resist known attacks by both classical and quantum computers. It runs on ordinary computers and networks; unlike QKD, it does not require quantum hardware or a quantum channel.</p><p>The urgent question is long-lived secrecy: data protected today may be recorded now and attacked later if large fault-tolerant quantum computers become practical.</p></div><div class="qubit-section"><h2>Core concepts: the quantum threat</h2><p>Shor's algorithm could break the mathematical problems behind RSA and elliptic-curve public-key cryptography if a sufficiently capable fault-tolerant quantum computer exists. Grover's algorithm gives a quadratic speed-up for brute-force search, which generally means symmetric systems should use appropriately larger key sizes rather than being discarded.</p><div class="gate-comparison"><div><strong>Security task</strong><strong>Traditional example</strong><strong>Quantum planning response</strong></div><div><span>Key establishment</span><span>RSA or elliptic-curve key exchange</span><span>Migrate to a PQC key-establishment method.</span></div><div><span>Digital signatures</span><span>RSA or elliptic-curve signatures</span><span>Migrate to a PQC signature method.</span></div><div><span>Symmetric encryption</span><span>AES-style secret-key encryption</span><span>Choose conservative key sizes against Grover-style search.</span></div></div></div><div class="qubit-section"><h2>How PQC works</h2><p>Many leading PQC schemes rely on problems involving high-dimensional mathematical lattices. A common example is <strong>Learning With Errors</strong> (LWE): a problem that hides a structured relationship behind small random errors. The intended user can work with the structure, while an attacker faces a difficult recovery problem.</p><p>Security comes from the hardness of the underlying mathematical problem, not from keeping the algorithm secret. Implementations must also protect private keys and resist side-channel attacks.</p></div><div class="qubit-section"><h2>Important techniques and standards</h2><div class="gate-comparison"><div><strong>Technique</strong><strong>Purpose</strong><strong>Example role</strong></div><div><span>ML-KEM</span><span>Key encapsulation / shared-key establishment</span><span>Derived from the Kyber family.</span></div><div><span>ML-DSA</span><span>Digital signatures</span><span>Derived from the Dilithium family.</span></div><div><span>Hybrid cryptography</span><span>Combines current and post-quantum methods</span><span>Helps a migration avoid dependence on one family alone.</span></div><div><span>Crypto-agility</span><span>Ability to replace algorithms and parameters</span><span>Makes future upgrades manageable.</span></div></div></div><div class="qubit-section"><h2>Simple migration example</h2><p>A service can establish a session key with both an existing public-key method and ML-KEM, then combine the two results. During the transition, an attacker would need to defeat the protection assumptions used by the hybrid design rather than only one of them.</p><p>This is not simply a library update. Certificates, protocols, hardware devices, stored data, partner integrations, and key-management systems may all need compatible changes.</p></div><div class="qubit-section"><h2>Real-world applications</h2><p>PQC matters wherever public-key cryptography protects software updates, web services, identity systems, confidential archives, financial records, industrial control systems, and communication between organisations. Systems with information that must remain secret for many years are often prioritised.</p></div><div class="qubit-section"><h2>Challenges and limitations</h2><p>PQC algorithms can have different key sizes, signature sizes, bandwidth costs, and performance trade-offs from older systems. Organisations need a cryptographic inventory, tested migration plan, interoperable implementations, and crypto-agility so that algorithms can be replaced if guidance evolves.</p></div><aside class="key-idea"><span class="card-label">Key takeaway</span><p>PQC is a present-day migration discipline. Understand the Shor and Grover threats, adopt suitable standardized methods such as ML-KEM and ML-DSA, and build systems that can change cryptography safely.</p></aside>` },
  { title: 'Quantum Machine Learning', intro: 'Explore how parameterized quantum circuits can participate in machine-learning workflows.', body: `<div class="qubit-section"><h2>Introduction</h2><p>Quantum machine learning (QML) studies how quantum circuits may participate in machine-learning workflows. Most practical experiments are <strong>hybrid</strong>: classical software prepares data and updates parameters, while a quantum circuit produces measured features, probabilities, or scores.</p><p>QML is not a replacement for classical machine learning. It is a research area where every proposed benefit should be compared with a strong classical baseline.</p></div><div class="qubit-section"><h2>Core concepts</h2><div class="comparison-grid"><div><strong>Classical ML</strong><span>Stores features in ordinary numbers and learns parameters in a classical model.</span></div><div><strong>QML</strong><span>Encodes selected features into quantum states, applies a circuit, and estimates values through measurement.</span></div><div><strong>Data encoding</strong><span>Maps numbers to gate angles, amplitudes, basis states, or other circuit inputs.</span></div><div><strong>Trainable circuit</strong><span>Uses adjustable gate angles whose values are updated by a classical optimizer.</span></div></div></div><div class="qubit-section"><h2>How it works</h2><div class="state-flow math-flow"><span>Classical data</span><b>→</b><strong>Encode</strong><b>→</b><span>Quantum circuit</span><b>→</b><strong>Measure</strong><b>→</b><span>Classical optimizer</span></div><p>First, a program scales and selects data features. It encodes them into a circuit, applies trainable gates, and measures an observable such as the average value of a qubit. A classical loss function compares that output with a label or target and changes the circuit parameters for the next iteration.</p></div><div class="qubit-section"><h2>Important techniques</h2><ul class="hardware-list"><li><strong>Variational circuits:</strong> parameterized circuits trained with a classical optimizer.</li><li><strong>Quantum kernels:</strong> circuits map data into a feature space; a classical kernel method uses the resulting similarity values.</li><li><strong>Quantum neural networks (QNNs):</strong> trainable quantum circuits used as model components, not literal copies of classical neural networks.</li><li><strong>Generative and scientific models:</strong> research directions for producing or analysing structured data.</li></ul></div><div class="qubit-section"><h2>Simple example</h2><p>Consider two normalized features, x and y. A circuit can encode them as rotation angles on two qubits, add an entangling gate, then measure one qubit. If the measured expectation value is above a learned threshold, the hybrid model predicts one class; otherwise it predicts the other.</p><p>The measurement is statistical, so the circuit is sampled many times. The optimizer learns from estimated averages, not from one single quantum measurement.</p></div><div class="qubit-section"><h2>Real-world applications</h2><p>Researchers investigate QML for scientific data analysis, quantum chemistry data, anomaly detection, feature engineering, and kernel-based classification. Potentially useful domains often have structured, high-dimensional, or naturally quantum data, but applicability depends on the problem and the available hardware.</p></div><div class="qubit-section"><h2>Challenges and limitations</h2><p>Loading large classical data sets into quantum circuits can be expensive, and measurements add sampling noise. Current hardware has limited qubits and noise, while some variational circuits can be difficult to train because gradients become very small. A claimed advantage must include fair accuracy, runtime, cost, and data-access comparisons with classical ML.</p></div><aside class="key-idea"><span class="card-label">Key takeaway</span><p>QML combines classical learning with quantum circuits. Data encoding, variational circuits, kernels, and careful benchmarking matter more than assuming that a quantum component automatically improves a model.</p></aside>` },
  { title: 'Quantum Optimization', intro: 'See how quantum and hybrid methods can represent choices, constraints, and objective scores.', body: `<div class="qubit-section"><h2>Introduction</h2><p>Optimization asks for the best choice among many possibilities while respecting constraints. Route planning, timetables, portfolios, factory schedules, and resource allocation all have this form: define choices, score them, and find a feasible choice with a good score.</p><p>A quantum method does not remove the need for a good model. The objective and constraints must be translated correctly before a circuit can explore candidate bit strings.</p></div><div class="qubit-section"><h2>Core concepts</h2><div class="gate-comparison"><div><strong>Concept</strong><strong>Meaning</strong><strong>Example</strong></div><div><span>Decision variable</span><span>A value the solver can choose.</span><span>A bit that says whether a route is selected.</span></div><div><span>Objective / cost</span><span>A number to minimize or maximize.</span><span>Total travel time or financial risk.</span></div><div><span>Constraint</span><span>A rule a valid answer must satisfy.</span><span>Choose exactly one route for each delivery.</span></div><div><span>Penalty</span><span>An added cost for breaking a rule.</span><span>Penalize incompatible selections.</span></div></div></div><div class="qubit-section"><h2>How it works: QAOA</h2><p>The Quantum Approximate Optimization Algorithm (QAOA) is a hybrid approach that alternates two parameterized operations. The <strong>cost layer</strong> encodes the objective as phases, while the <strong>mixer layer</strong> moves amplitude among candidate bit strings so the circuit can explore alternatives.</p><div class="state-flow math-flow"><span>Objective and constraints</span><b>→</b><strong>Cost model</strong><b>→</b><span>Cost + mixer layers</span><b>→</b><strong>Samples</strong><b>→</b><span>Best valid choice</span></div><p>A classical optimizer changes the cost and mixer angles, then uses repeated measurements to estimate which settings produce better candidate solutions.</p></div><div class="qubit-section"><h2>Important techniques</h2><ul class="hardware-list"><li><strong>QAOA:</strong> alternating cost and mixer layers for combinatorial optimization.</li><li><strong>QUBO / Ising modelling:</strong> common mathematical forms that represent binary choices and their interactions.</li><li><strong>Variational optimization:</strong> a classical optimizer tunes circuit parameters from sampled measurements.</li><li><strong>Classical post-processing:</strong> checks feasibility and evaluates the original objective after sampling.</li></ul></div><div class="qubit-section"><h2>Simple example</h2><p>Imagine selecting deliveries using three binary variables. A bit string such as 101 means choose deliveries one and three. The cost function can reward short routes and add a large penalty if two choices use the same limited vehicle.</p><p>After sampling, 101 is only a candidate. The original classical model must verify that it satisfies every constraint and compare its actual cost with other feasible choices.</p></div><div class="qubit-section"><h2>Real-world applications</h2><p>Quantum optimization is explored for logistics and routing, workforce scheduling, manufacturing plans, portfolio research, supply allocation, traffic coordination, and energy-grid operation. Many of these problems are also addressed effectively by mature classical solvers, so the comparison is essential.</p></div><div class="qubit-section"><h2>Challenges and limitations</h2><p>Encoding constraints may require many qubits or carefully tuned penalties. QAOA needs repeated measurements and classical parameter optimization, and deeper circuits can be sensitive to noise. A useful evaluation compares solution quality, runtime, cost, scalability, and reliability against strong classical heuristics and exact methods where possible.</p></div><aside class="key-idea"><span class="card-label">Key takeaway</span><p>Quantum optimization begins with modelling. QAOA uses cost and mixer layers to sample promising bit strings, but classical validation and comparison determine whether those samples are useful solutions.</p></aside>` },
  { title: 'Quantum Simulation', intro: 'Explore applications that model molecules, materials, and other systems governed by quantum mechanics.', body: `<div class="qubit-section"><h2>Introduction</h2><p>Quantum simulation studies a quantum system by representing its particles, energies, and interactions in a mathematical model. It is a natural application because molecules, materials, and many physical processes already follow quantum mechanics.</p><p>Both classical and quantum simulators are valuable. Classical simulation is excellent for small circuits and many scientific approximations; quantum hardware may eventually help with selected systems that become difficult to represent classically.</p></div><div class="qubit-section"><h2>Core concepts</h2><p>A state vector stores one complex amplitude for every possible basis state. For n qubits, that is <strong>2<sup>n</sup></strong> amplitudes, so an exact state-vector simulation doubles in size whenever one qubit is added. This growth explains why classical simulation eventually becomes demanding.</p><div class="comparison-grid"><div><strong>Circuit simulation</strong><span>Applies gates to a state model and predicts amplitudes or probabilities.</span></div><div><strong>Measurement and sampling</strong><span>Turns probabilities into finite counts from repeated shots.</span></div><div><strong>Hamiltonian</strong><span>A mathematical description of energy and interactions in a physical system.</span></div><div><strong>Observable</strong><span>A measurable property such as energy, magnetization, or correlation.</span></div></div></div><div class="qubit-section"><h2>How it works</h2><div class="state-flow math-flow"><span>Physical system</span><b>→</b><strong>Hamiltonian model</strong><b>→</b><span>Qubit encoding</span><b>→</b><strong>Measurements</strong><b>→</b><span>Estimated property</span></div><p>Scientists choose a simplified physical model, encode it for qubits, prepare a circuit, and measure the observable of interest many times. The results are combined with classical calculations to estimate properties such as energy levels or reaction-relevant behaviour.</p></div><div class="qubit-section"><h2>Important techniques and tools</h2><div class="gate-comparison"><div><strong>Technique or tool</strong><strong>Use</strong><strong>Learning purpose</strong></div><div><span>State-vector simulation</span><span>Tracks ideal amplitudes exactly for small systems.</span><span>Shows how gates change a circuit before measurement.</span></div><div><span>Shot sampling</span><span>Produces measurement counts.</span><span>Connects probabilities with finite experimental data.</span></div><div><span>VQE</span><span>Uses a parameterized circuit and optimizer to estimate low energy.</span><span>Illustrates hybrid quantum-classical simulation.</span></div><div><span>Qiskit / PennyLane / Sia &amp; HDQS</span><span>Frameworks for building, simulating, and inspecting circuits.</span><span>Provide different workflows for experiments and learning.</span></div></div></div><div class="qubit-section"><h2>Simple example</h2><p>A two-qubit circuit can prepare an entangled state and sample its outcomes. An ideal state-vector view may show equal amplitudes for 00 and 11, while 100 measurement shots might return 47 counts of 00 and 53 counts of 11. The difference is sampling variation, not necessarily a different underlying probability.</p></div><div class="qubit-section"><h2>Real-world applications</h2><p>Quantum simulation is explored for molecular energies, chemical reactions, catalysts, battery materials, superconductors, and other materials-design questions. In drug discovery, a quantum calculation could contribute to molecular modelling, but it is only one part of a much larger process involving biology, experiments, safety, and clinical evidence.</p></div><div class="qubit-section"><h2>Challenges and limitations</h2><p>Accurate physical models can be difficult to build, and real hardware has noise and limited circuit depth. Classical methods remain highly capable, so a simulation result needs validation against reliable classical calculations, experiments, and domain knowledge. A quantum computation is not automatically an accurate physical prediction.</p></div><aside class="key-idea"><span class="card-label">Key takeaway</span><p>Quantum simulation connects circuits with real quantum systems. State vectors explain ideal amplitudes, sampling explains measurements, and useful scientific results require careful modelling and validation.</p></aside>` },
  { title: 'Quantum Computing in Industry', intro: 'Survey how organisations are exploring quantum methods alongside classical systems and domain expertise.', body: `<div class="qubit-section"><h2>Introduction</h2><p>Quantum computing in industry is usually hybrid work: domain specialists, classical software engineers, data scientists, simulators, and quantum researchers work on a focused problem together. The aim is to test a measurable hypothesis, not to replace an entire business process with a quantum computer.</p><p>A responsible project starts with the business or scientific decision that needs improvement, then asks whether a quantum method has a plausible role alongside existing tools.</p></div><div class="qubit-section"><h2>Core concepts</h2><ul class="hardware-list"><li><strong>Use case:</strong> a specific decision, calculation, or workflow with a measurable goal.</li><li><strong>Classical baseline:</strong> the best relevant non-quantum method used for comparison.</li><li><strong>Hybrid workflow:</strong> a quantum subroutine combined with classical pre-processing, optimization, and validation.</li><li><strong>Proof of concept:</strong> a narrow experiment that tests feasibility, not a production promise.</li></ul></div><div class="qubit-section"><h2>How an industry pilot works</h2><div class="state-flow math-flow"><span>Business question</span><b>→</b><strong>Classical baseline</strong><b>→</b><span>Quantum model</span><b>→</b><strong>Test and measure</strong><b>→</b><span>Adopt or stop</span></div><ol><li>Choose a narrow question with data, constraints, and a success metric.</li><li>Build or identify a strong classical baseline first.</li><li>Prototype the quantum representation with a simulator, then selected hardware where justified.</li><li>Measure solution quality, runtime, cost, reliability, and integration effort.</li><li>Keep only approaches that improve a meaningful metric.</li></ol></div><div class="qubit-section"><h2>Industry applications</h2><div class="comparison-grid"><div><strong>Finance</strong><span>Risk analysis, pricing research, portfolio optimization, and fraud-related research.</span></div><div><strong>Healthcare and drug discovery</strong><span>Molecular modelling, protein and materials research, and scientific data analysis.</span></div><div><strong>Cybersecurity</strong><span>PQC migration, cryptographic inventory, and secure-communication research.</span></div><div><strong>Logistics</strong><span>Routing, scheduling, allocation, and supply-chain modelling.</span></div><div><strong>Manufacturing</strong><span>Production scheduling, materials research, quality optimisation, and design studies.</span></div><div><strong>Energy</strong><span>Grid optimization research, battery and catalyst materials, and demand planning.</span></div><div><strong>AI</strong><span>Hybrid machine-learning research, kernels, and specialised scientific-data models.</span></div></div></div><div class="qubit-section"><h2>Simple example</h2><p>A logistics team may model a small delivery-routing decision as binary choices and compare a quantum optimization prototype with its current routing heuristic. The result is useful only if it meets the same delivery constraints and improves a chosen metric such as cost, planning time, or solution quality.</p></div><div class="qubit-section"><h2>Challenges and limitations</h2><p>Today's hardware has noise, limited qubits, and costs that may exceed the benefit of a prototype. Data access, security, integration with existing systems, workforce skills, and vendor interoperability are practical constraints too. Claims of advantage need reproducible evidence against realistic classical alternatives.</p></div><div class="qubit-section"><h2>Responsible adoption</h2><p>Industry teams should avoid treating quantum computing as a generic solution. They should keep sensitive data protected, evaluate vendors and algorithms carefully, build internal literacy, and maintain a portfolio of small, evidence-driven experiments. For cybersecurity, PQC migration can be valuable even before quantum hardware is useful for computation.</p></div><aside class="key-idea"><span class="card-label">Key takeaway</span><p>Industry value is domain-specific and evidence-driven. The strongest quantum projects pair real domain problems with classical baselines, careful integration, and honest measurements of benefit.</p></aside>` }
];
const gateGroups = [
  { title: 'Introduction', page: 'introduction' },
  { title: 'Single-Qubit Gates', page: 'single', children: [{ title: 'X Gate', page: 'x' }, { title: 'Y Gate', page: 'y' }, { title: 'Z Gate', page: 'z' }, { title: 'Hadamard Gate', page: 'h' }, { title: 'S Gate', page: 's' }, { title: 'T Gate', page: 't' }, { title: 'Rotation Gates', page: 'rotations', children: [{ title: 'RX Gate', page: 'rx' }, { title: 'RY Gate', page: 'ry' }, { title: 'RZ Gate', page: 'rz' }] }] },
  { title: 'Multi-Qubit Gates', page: 'multi', children: [{ title: 'CNOT Gate', page: 'cnot' }, { title: 'CZ Gate', page: 'cz' }, { title: 'SWAP Gate', page: 'swap' }] },
  { title: 'Universal Gates', page: 'universal' },
  { title: 'Gates in Quantum Circuits', page: 'circuits' }
];
const gatePageOrder = ['introduction', 'single', 'x', 'y', 'z', 'h', 's', 't', 'rotations', 'rx', 'ry', 'rz', 'multi', 'cnot', 'cz', 'swap', 'universal', 'circuits'];

const state = { activeChapter: 0, activeTopic: 0, activeMathTopic: 0, activeGatePage: 'introduction', activeCircuitTopic: 0, activeCircuitStudyTopic: -1, activeAlgorithmTopic: 0, activeSimulationTopic: 0, activeFrameworkTopic: 0, activeApplicationTopic: 0, activeDocTopic: -1, activeDocSectionIndex: -1, fundamentalsExpanded: false, mathematicsExpanded: false, gatesExpanded: false, circuitsExpanded: false, algorithmsExpanded: false, simulationExpanded: false, frameworksExpanded: false, applicationsExpanded: false, singleGatesExpanded: false, rotationGatesExpanded: false, multiGatesExpanded: false, completed: JSON.parse(localStorage.getItem('learn-quantum-progress') || '[]') };
state.expandedSection = 'basics';
state.lastRenderedSection = null;
const siaDocNavigationTopics = siaDocSections.map((section, sectionIndex) => section.parts.map((topic) => ({
  title: topic.title,
  route: { group: 'sia-doc', index: siaDocTopics.findIndex((item) => item.sectionIndex === sectionIndex && item.title === topic.title) }
})));
const navigationSections = [
  {
    id: 'basics',
    title: 'Basics',
    topics: fundamentalsTopics.map((topic, index) => ({ title: topic.title, route: { group: 'fundamentals', index } }))
  },
  {
    id: 'mathematical-foundations',
    title: 'Mathematical Foundations',
    topics: [
      ...mathematicsTopics.map((topic, index) => ({ title: topic.title, route: { group: 'math', index } }))
    ]
  },
  {
    id: 'circuits-and-gates',
    title: 'Quantum Circuits and Gates',
    topics: siaDocNavigationTopics[0]
  },
  {
    id: 'sia-script-programming',
    title: 'Sia Script Programming',
    topics: siaDocNavigationTopics[1]
  },
  {
    id: 'quantum-algorithms-and-applications',
    title: 'Quantum Algorithms and Applications',
    topics: siaDocNavigationTopics[2]
  },
  {
    id: 'visualization-and-research-tools',
    title: 'Visualization and Research Tools',
    topics: siaDocNavigationTopics[3]
  },
  {
    id: '3d-models-and-printing',
    title: '3D Models',
    topics: siaDocNavigationTopics[4]
  },
  {
    id: 'teaching-and-interactive-learning',
    title: 'Teaching and Interactive Learning',
    topics: siaDocNavigationTopics[5]
  },
  {
    id: 'quantum-machine-learning-and-integration',
    title: 'Quantum Machine Learning and Integration',
    topics: siaDocNavigationTopics[6]
  }
];
const $ = (selector) => document.querySelector(selector);
const chapterList = $('#chapter-list');

function renderSidebar() {
  const activeSectionId = state.activeDocSectionIndex >= 0 ? navigationSections[state.activeDocSectionIndex + 2]?.id : state.activeChapter === 0 ? 'basics'
    : state.activeChapter === 1 ? 'mathematical-foundations'
      : state.activeChapter === 2 || state.activeChapter === 3 ? 'circuits-and-gates'
        : state.activeChapter === 4 ? 'quantum-algorithms-and-applications'
          : state.activeChapter === 5 ? 'sia-script-programming'
            : state.activeChapter === 6 || state.activeChapter === 7 && state.activeApplicationTopic === 2 ? 'quantum-machine-learning-and-integration'
              : 'quantum-algorithms-and-applications';
  if (state.lastRenderedSection !== activeSectionId) {
    state.expandedSection = activeSectionId;
    state.lastRenderedSection = activeSectionId;
  }

  const isActiveTopic = (route) => {
    if (!route) return false;
    if (route.group === 'fundamentals') return state.activeChapter === 0 && state.activeTopic === route.index;
    if (route.group === 'math') return state.activeChapter === 1 && state.activeMathTopic === route.index;
    if (route.group === 'gate') return state.activeChapter === 2 && state.activeGatePage === route.page;
    if (route.group === 'circuit') return state.activeChapter === 3 && state.activeCircuitStudyTopic < 0 && state.activeCircuitTopic === route.index;
    if (route.group === 'circuit-study') return state.activeChapter === 3 && state.activeCircuitStudyTopic === route.index;
    if (route.group === 'algorithm') return state.activeChapter === 4 && state.activeAlgorithmTopic === route.index;
    if (route.group === 'simulation') return state.activeChapter === 5 && state.activeSimulationTopic === route.index;
    if (route.group === 'framework') return state.activeChapter === 6 && state.activeFrameworkTopic === route.index;
    if (route.group === 'application') return state.activeChapter === 7 && state.activeApplicationTopic === route.index;
    if (route.group === 'sia-doc') return state.activeChapter === siaDocTopics[route.index]?.chapter && state.activeDocTopic === route.index;
    return false;
  };
  const topicsMarkup = (topics) => topics.map((topic) => {
    if (!topic.route) return `<span class="chapter-topic navigation-only" aria-disabled="true">${topic.title}</span>`;
    const route = topic.route;
    const active = isActiveTopic(route);
    const routeAttributes = `data-nav-route="${route.group}" data-nav-index="${route.index ?? ''}" data-nav-page="${route.page ?? ''}"`;
    return `<button type="button" class="chapter-topic ${active ? 'active' : ''}" ${routeAttributes} ${active ? 'aria-current="page"' : ''}>${topic.title}</button>`;
  }).join('');

  chapterList.innerHTML = navigationSections.map((section, index) => {
    const expanded = state.expandedSection === section.id;
    const active = activeSectionId === section.id;
    return `<section class="nav-section">
      <button type="button" class="chapter-item ${active ? 'active' : ''}" data-section="${section.id}" aria-expanded="${expanded}" aria-controls="nav-${section.id}">
        <span class="chapter-index">${String(index + 1).padStart(2, '0')}</span>
        <span class="chapter-name">${section.title}</span>
        <span class="chapter-toggle" aria-hidden="true">${expanded ? '−' : '+'}</span>
      </button>
      <div class="chapter-submenu" id="nav-${section.id}" role="group" aria-label="${section.title}" ${expanded ? '' : 'hidden'}>${topicsMarkup(section.topics)}</div>
    </section>`;
  }).join('');

  chapterList.querySelectorAll('[data-section]').forEach((button) => button.addEventListener('click', () => {
    const sectionId = button.dataset.section;
    if (sectionId === 'mathematical-foundations' && (state.activeChapter !== 1 || state.activeMathTopic !== 0)) {
      state.expandedSection = sectionId;
      loadMathTopic(0);
      return;
    }
    state.expandedSection = state.expandedSection === button.dataset.section ? null : button.dataset.section;
    renderSidebar();
  }));
  chapterList.querySelectorAll('[data-nav-route]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation();
    const index = Number(button.dataset.navIndex);
    switch (button.dataset.navRoute) {
      case 'fundamentals': state.activeDocTopic = -1; state.activeDocSectionIndex = -1; loadTopic(index); break;
      case 'math': state.activeDocTopic = -1; state.activeDocSectionIndex = -1; loadMathTopic(index); break;
      case 'gate': loadGatePage(button.dataset.navPage); break;
      case 'circuit': loadCircuitTopic(index); break;
      case 'circuit-study': loadCircuitStudyTopic(index); break;
      case 'algorithm': loadAlgorithmTopic(index); break;
      case 'simulation': loadSimulationTopic(index); break;
      case 'framework': loadFrameworkTopic(index); break;
      case 'application': loadApplicationTopic(index); break;
      case 'sia-doc': loadSiaDocTopic(index); break;
    }
  }));
  const percent = Math.round((state.completed.length / chapters.length) * 100);
  $('#progress-percent').textContent = `${percent}%`;
  $('#progress-count').textContent = state.completed.length;
  $('#progress-bar').style.width = `${percent}%`;
}

function lessonTemplate(index) {
  if (index === 0) return topicTemplate(state.activeTopic);
  if (index === 1) return `
    <h2>Bits are either / or. Qubits can be both.</h2>
    <p>A classical bit is a tiny switch: it is <strong>0</strong> or <strong>1</strong>. A qubit is more like a compass needle. Before we look at it, it can point in a blend of directions, carrying a probability of being measured as either state.</p>
    <p>This is called <strong>superposition</strong>. It is not simply “being undecided.” It is a real physical state, and when we measure it, the possibilities resolve into one definite answer.</p>
    <div class="visual-card" id="superposition-demo">
      <div class="visual-card-header"><div><span class="card-label">Try it / 01</span><h3>Stretch a qubit between worlds</h3><p>Drag the slider to change the chance of measuring a 1.</p></div><span class="orbit-icon" aria-hidden="true">◌</span></div>
      <div class="qubit-stage"><div class="qubit-wrap"><div class="qubit" id="qubit-zero">0</div><span class="qubit-label">classical zero</span></div><div class="qubit-wrap"><div class="qubit super" id="qubit-super">0 + 1</div><span class="qubit-label">superposition</span></div><div class="qubit-wrap"><div class="qubit" id="qubit-one">1</div><span class="qubit-label">classical one</span></div></div>
      <label class="range-control"><span>0</span><input id="probability-slider" type="range" min="0" max="100" value="50"><span>1</span><strong class="range-value" id="probability-value">50 / 50</strong></label>
    </div>
    <h3>Possibility is only half the story</h3>
    <p>When qubits interact, their possibilities can become linked. This is <strong>entanglement</strong>: measuring one qubit tells you something about another, even when they are separated.</p>
    <div class="quiz"><span class="card-label">Quick check</span><h3>What happens when a qubit is measured?</h3><div class="quiz-options"><button class="quiz-option" data-correct="false">It stays in every state at once.</button><button class="quiz-option" data-correct="true">Its possibilities resolve to one result.</button><button class="quiz-option" data-correct="false">It becomes a classical computer.</button></div><p class="quiz-feedback" id="quiz-feedback"></p></div>`;
  if (index === 1) return `<h2>Vectors give possibility a shape.</h2><p>We represent a qubit as a vector: <strong>|ψ⟩ = α|0⟩ + β|1⟩</strong>. The numbers α and β are amplitudes. Their squared magnitudes become the probabilities we see when measuring.</p><div class="visual-card"><div class="visual-card-header"><div><span class="card-label">Explore / 02</span><h3>Amplitude is not probability</h3><p>Change the amplitude of |1⟩ and watch the probabilities rebalance.</p></div></div><div class="amplitude-bar"><div class="amplitude-column"><span id="amp-zero" style="height: 50%"></span><small>|0⟩</small></div><div class="amplitude-column"><span id="amp-one" style="height: 50%"></span><small>|1⟩</small></div></div><label class="range-control"><span>α</span><input id="amplitude-slider" type="range" min="0" max="100" value="50"><strong class="range-value" id="amplitude-value">50%</strong></label></div><h3>Normalize the universe</h3><p>Because something must happen when we measure, the probabilities always add up to one: <strong>|α|² + |β|² = 1</strong>. This simple rule is called normalization.</p><div class="code-block">state = [α, β]<br>probability(0) = |α|²<br>probability(1) = |β|²</div>`;
  if (index === 2) return quantumGatesLessonTemplate();
  if (index === 3) return `<h2>Read a circuit like a sentence.</h2><p>Time flows from left to right. Each horizontal wire is a qubit, and each box is an operation. The small vertical connection below is where two qubits begin to share one quantum story.</p><div class="visual-card"><div class="visual-card-header"><div><span class="card-label">Circuit anatomy / 04</span><h3>A two-qubit hello world</h3><p>Hadamard plus controlled-not creates entanglement.</p></div></div><div class="circuit-diagram"><div class="circuit-line"><span>q₀</span><div class="c-wire"></div><b class="c-gate">H</b><div class="c-wire"></div><b class="c-gate">●</b><div class="c-wire"></div></div><div class="circuit-line"><span>q₁</span><div class="c-wire"></div><b class="c-gate empty"> </b><div class="c-wire"></div><b class="c-gate target">⊕</b><div class="c-wire"></div></div><div class="c-connector"></div></div></div><p>Run it and the pair lands in a shared state: measuring one gives you immediate information about the other. That correlation is the resource, not a faster-than-light message.</p>`;
  const endings = [
    ['Search for the useful interference.', 'Algorithms are choreographies for amplitudes. Grover amplifies a marked answer; Shor finds hidden periodicity. Both make probability do the heavy lifting.', 'Start with the question, then design the interference pattern that makes its answer stand out.'],
    ['Make a model, then listen closely.', 'A quantum simulator maps a problem onto qubits and lets their evolution reveal structure. Variational methods alternate between a quantum circuit and a classical optimizer.', 'The art is choosing a model that is expressive enough to be useful and small enough to run.'],
    ['Theory needs a place to run.', 'Frameworks such as Qiskit, Cirq, and PennyLane help you compose circuits, choose backends, inspect results, and move between simulation and hardware.', 'Good quantum software keeps the circuit readable: named parameters, small experiments, and measurements you can explain.'],
    ['The horizon is wide open.', 'Quantum sensing may detect tiny changes in fields. Chemistry may benefit from natural quantum representations. Optimization remains an active, honest research question.', 'The most interesting applications will be co-designed with the hardware. Keep learning, keep testing, and stay curious.']
  ][index - 4];
  return `<h2>${endings[0]}</h2><p>${endings[1]}</p><p>${endings[2]}</p><div class="code-block">chapter_${String(index + 1).padStart(2, '0')} = {<br>&nbsp;&nbsp;question: "What can a quantum system reveal?",<br>&nbsp;&nbsp;method: "Experiment, measure, learn"<br>}</div><div class="quiz"><span class="card-label">Reflection</span><h3>What idea from this chapter would you explain to a friend?</h3><button class="gate-button" id="reflection-button">Mark chapter complete ✓</button><p class="quiz-feedback" id="reflection-feedback"></p></div>`;
}

function quantumGatesLessonTemplate() {
  return `<section class="gates-lesson math-lesson">
    <div class="qubit-section"><h2>Introduction</h2><p>Quantum gates are operations that transform quantum states. Unlike many classical logic gates, valid quantum gates are unitary and reversible, so they preserve the rules of quantum mechanics.</p><p>Gates are represented by matrices and act on state vectors:</p><div class="qubit-equation">|ψ'⟩ = U|ψ⟩, &nbsp;&nbsp; U†U = I</div><div class="state-flow math-flow"><span>Qubit</span><b>→</b><strong>Gate</strong><b>→</b><span>Circuit</span><b>→</b><strong>Algorithm</strong></div><div class="gate-row"><div class="gate" id="input-gate">0</div><div class="wire"></div><div class="gate-button active" id="active-gate">H</div><div class="wire"></div><div class="gate target" id="output-gate">0+1</div></div><div class="gate-controls"><button class="gate-button active" data-gate="H" type="button">H · superpose</button><button class="gate-button" data-gate="X" type="button">X · flip</button><button class="gate-button" data-gate="Z" type="button">Z · phase</button></div><p>A gate changes amplitudes and phase in a controlled way. Circuits combine these small transformations into useful computations.</p><p>Applying gates in sequence composes their transformations. Relative phase may not alter an immediate measurement, but later gates can make amplitudes interfere and change the final outcome probabilities.</p></div>
    <div class="qubit-section"><h2>Single-Qubit Gates</h2><p>Single-qubit gates act on the two-dimensional state space of one qubit. Each gate has a definition, a matrix, and a predictable action on basis states. Their matrix columns show where |0> and |1> go; multiplying the matrix by an input amplitude vector gives the output state. Because the operation is reversible, no information about the qubit is discarded.</p>
      <div class="gate-section"><h3>X Gate</h3><p>The X gate is a bit flip: it exchanges the computational basis states.</p><div class="qubit-equation">X = [0 &nbsp; 1; 1 &nbsp; 0]</div><p>X|0⟩ = |1⟩, &nbsp; X|1⟩ = |0⟩</p><div class="circuit-line-simple"><span>|0⟩</span><i>───</i><strong>X</strong><i>───</i><span>|1⟩</span></div><small class="gate-use">Use: toggling a qubit, analogous to a classical NOT.</small><p class="gate-takeaway">Key takeaway: X flips the basis state.</p></div>
      <div class="gate-section"><h3>Y Gate</h3><p>The Y gate combines a bit flip with a phase factor.</p><div class="qubit-equation">Y = [0 &nbsp; −i; i &nbsp;&nbsp; 0]</div><p>Y|0⟩ = i|1⟩, &nbsp; Y|1⟩ = −i|0⟩</p><div class="circuit-line-simple"><span>|ψ⟩</span><i>───</i><strong>Y</strong><i>───</i><span>changed state</span></div><small class="gate-use">Use: combined state and phase transformations.</small><p class="gate-takeaway">Key takeaway: Y flips and phases a qubit.</p></div>
      <div class="gate-section"><h3>Z Gate</h3><p>The Z gate is a phase flip. It leaves |0⟩ unchanged and changes the sign of |1⟩.</p><div class="qubit-equation">Z = [1 &nbsp; 0; 0 &nbsp; −1]</div><p>Z|0⟩ = |0⟩, &nbsp; Z|1⟩ = −|1⟩</p><div class="circuit-line-simple"><span>|1⟩</span><i>───</i><strong>Z</strong><i>───</i><span>−|1⟩</span></div><small class="gate-use">Bloch sphere: a half-turn around the z-axis.</small><p class="gate-takeaway">Key takeaway: Z changes phase without changing basis probabilities.</p></div>
      <div class="gate-section"><h3>Hadamard Gate</h3><p>The Hadamard gate changes between the computational and superposition bases.</p><div class="qubit-equation">H = 1/√2 [1 &nbsp; 1; 1 &nbsp; −1]</div><p>H|0⟩ = |+⟩ = (|0⟩ + |1⟩)/√2</p><div class="circuit-line-simple"><span>|0⟩</span><i>───</i><strong>H</strong><i>───</i><span>|+⟩</span></div><small class="gate-use">Bloch sphere: rotates a basis pole toward an equal superposition.</small><p class="gate-takeaway">Key takeaway: H creates and reverses equal superposition.</p></div>
      <div class="gate-section"><h3>S Gate</h3><p>The S gate is a quarter-turn phase gate.</p><div class="qubit-equation">S = [1 &nbsp; 0; 0 &nbsp; i]</div><p>S|0⟩ = |0⟩, &nbsp; S|1⟩ = i|1⟩</p><div class="circuit-line-simple"><span>|ψ⟩</span><i>───</i><strong>S</strong><i>───</i><span>phase shifted</span></div><small class="gate-use">Use: adding a controlled relative phase.</small><p class="gate-takeaway">Key takeaway: S rotates phase by π/2.</p></div>
      <div class="gate-section"><h3>T Gate</h3><p>The T gate is an eighth-turn phase gate.</p><div class="qubit-equation">T = [1 &nbsp; 0; 0 &nbsp; e^(iπ/4)]</div><p>T|0⟩ = |0⟩, &nbsp; T|1⟩ = e^(iπ/4)|1⟩</p><div class="circuit-line-simple"><span>|ψ⟩</span><i>───</i><strong>T</strong><i>───</i><span>fine phase shift</span></div><small class="gate-use">Use: precise phase control in universal circuits.</small><p class="gate-takeaway">Key takeaway: T provides a smaller phase rotation than S.</p></div>
      <div class="gate-section"><h3>Rotation Gates</h3><p>RX, RY, and RZ rotate a qubit around the x-, y-, and z-axes of the Bloch sphere. The angle θ sets the rotation amount; half-angle sine and cosine terms in their matrices determine how amplitudes mix. RX and RY can change computational-basis probabilities, while RZ changes relative phase.</p><div class="qubit-equation">Rₓ(θ), &nbsp; Rᵧ(θ), &nbsp; R𝓏(θ)</div><div class="circuit-line-simple"><span>|ψ⟩</span><i>───</i><strong>Rₓ/Rᵧ/R𝓏</strong><i>───</i><span>rotated state</span></div><small class="gate-use">Use: continuously tuning amplitudes and phase.</small><p class="gate-takeaway">Key takeaway: rotation gates move a state around the Bloch sphere.</p></div>
    </div>
    <div class="qubit-section"><h2>Multi-Qubit Gates</h2><p>Multi-qubit gates act on a control and/or target qubit and create relationships between systems. Their matrices act on the joint basis (for two qubits: |00>, |01>, |10>, |11>), so an operation can depend on both qubits at once. Controlled gates can correlate qubits and, for suitable inputs, create entanglement; SWAP instead transfers which wire carries each state.</p><div class="gate-section"><h3>CNOT</h3><p>The controlled-NOT flips the target only when the control is |1⟩.</p><div class="qubit-equation">|10⟩ → |11⟩, &nbsp; |00⟩ → |00⟩</div><div class="circuit-sketch"><div>q₀: ── <strong>●</strong> ──</div><div>q₁: ── <strong>⊕</strong> ──</div><i>        │</i></div><p>Starting with |00⟩, H on the first qubit followed by CNOT gives (|00⟩ + |11⟩)/√2, connecting CNOT to entanglement.</p><p class="gate-takeaway">Key takeaway: CNOT conditionally flips a target.</p></div><div class="gate-section"><h3>CZ</h3><p>The controlled-Z applies a phase flip to |11⟩ while leaving the other basis states unchanged.</p><div class="qubit-equation">CZ|11⟩ = −|11⟩</div><p class="gate-takeaway">Key takeaway: CZ conditionally changes phase.</p></div><div class="gate-section"><h3>SWAP</h3><p>SWAP exchanges the states of two qubits.</p><div class="qubit-equation">SWAP|01⟩ = |10⟩</div><div class="circuit-sketch"><div>q₀: ── × ──</div><div>q₁: ── × ──</div></div><p class="gate-takeaway">Key takeaway: SWAP exchanges two qubit states.</p></div><div class="gate-section"><h3>Toffoli</h3><p>The Toffoli gate flips a target only when both control qubits are |1⟩.</p><div class="qubit-equation">|110⟩ → |111⟩, &nbsp; |100⟩ → |100⟩</div><p class="gate-takeaway">Key takeaway: Toffoli is a controlled-controlled flip.</p></div></div>
    <div class="qubit-section"><h2>Universal Gates</h2><p>A universal gate set can approximate any quantum computation when its gates are combined appropriately.</p><div class="qubit-equation">{H, T, CNOT}</div><ul><li><strong>H</strong> creates basis changes and superposition.</li><li><strong>T</strong> supplies fine phase control.</li><li><strong>CNOT</strong> links qubits and creates entanglement.</li></ul></div>
    <div class="qubit-section"><h2>Gates in Quantum Circuits</h2><p>A circuit is a sequence of quantum gates. Each wire carries a qubit, and each gate changes the state as time moves from left to right.</p><div class="circuit-sketch"><div>1 qubit: ── |0⟩ ── H ── Z ── Measure</div><div>2 qubits: ── |00⟩ ── H ── CNOT ── Measure</div></div><div class="state-flow math-flow"><span>Initialize</span><b>→</b><span>Apply Gates</span><b>→</b><span>Superposition/Entanglement</span><b>→</b><span>Interference</span><b>→</b><span>Measure</span><b>→</b><strong>Classical Result</strong></div><div class="gate-comparison"><div><strong>Gate</strong><strong>Qubits</strong><strong>Main effect</strong></div><div><span>X</span><span>1</span><span>Bit flip</span></div><div><span>Y</span><span>1</span><span>Bit + phase flip</span></div><div><span>Z</span><span>1</span><span>Phase flip</span></div><div><span>H</span><span>1</span><span>Superposition</span></div><div><span>S / T</span><span>1</span><span>Phase rotation</span></div><div><span>RX / RY / RZ</span><span>1</span><span>Rotation</span></div><div><span>CNOT / CZ</span><span>2</span><span>Controlled flip / phase</span></div><div><span>SWAP</span><span>2</span><span>Exchange states</span></div><div><span>Toffoli</span><span>3</span><span>Controlled-controlled flip</span></div></div><p><strong>Mathematical Foundations → Quantum Gates → Quantum Circuits → Quantum Algorithms</strong></p></div>
    <aside class="key-idea"><span class="card-label">Key takeaway</span><p>Quantum gates are reversible matrix operations that transform qubit states. Combining gates into circuits lets quantum algorithms shape amplitudes, phase, interference, and entanglement.</p></aside>
  </section>`;
}

const gatePageInfo = {
  single: ['Single-Qubit Gates', 'Single-qubit gates transform one qubit at a time. Choose a gate below to study its matrix, action, and use.'],
  multi: ['Multi-Qubit Gates', 'Multi-qubit gates coordinate two or more qubits, enabling controlled operations and entanglement.'],
  x: ['X Gate', 'The X gate flips a qubit between the computational basis states.', 'X = [0  1; 1  0]', 'X|0⟩ = |1⟩,  X|1⟩ = |0⟩', 'Use it as a quantum bit flip, analogous to a classical NOT gate.'],
  y: ['Y Gate', 'The Y gate combines a bit flip with a phase factor.', 'Y = [0  −i; i  0]', 'Y|0⟩ = i|1⟩,  Y|1⟩ = −i|0⟩', 'Use it when a state needs both a flip and a phase change.'],
  z: ['Z Gate', 'The Z gate changes phase while leaving the computational basis probabilities unchanged.', 'Z = [1  0; 0  −1]', 'Z|0⟩ = |0⟩,  Z|1⟩ = −|1⟩', 'Use it for phase marking and as a half-turn around the Bloch-sphere z-axis.'],
  h: ['Hadamard Gate', 'The Hadamard gate transforms a basis state into an equal superposition.', 'H = 1/√2 [1  1; 1  −1]', 'H|0⟩ = (|0⟩ + |1⟩)/√2', 'Use it to change between computational and superposition bases.'],
  s: ['S Gate', 'The S gate applies a quarter-turn of relative phase.', 'S = [1  0; 0  i]', 'S|0⟩ = |0⟩,  S|1⟩ = i|1⟩', 'Use it for precise phase control.'],
  t: ['T Gate', 'The T gate applies a smaller, eighth-turn phase rotation.', 'T = [1  0; 0  e^(iπ/4)]', 'T|0⟩ = |0⟩,  T|1⟩ = e^(iπ/4)|1⟩', 'Use it for fine phase control in universal circuits.'],
  rotations: ['Rotation Gates', 'RX, RY, and RZ rotate a qubit around the x-, y-, and z-axes of the Bloch sphere.', 'Rₓ(θ),  Rᵧ(θ),  R𝓏(θ)', 'Rₓ/Rᵧ/R𝓏(θ)|ψ⟩ = rotated state', 'Use rotations to continuously tune amplitudes and phase.'],
  rx: ['RX Gate', 'RX rotates a qubit around the x-axis of the Bloch sphere.', 'Rₓ(θ)', 'Rₓ(θ)|ψ⟩ = rotated state', 'Use it for continuous x-axis rotations.'],
  ry: ['RY Gate', 'RY rotates a qubit around the y-axis of the Bloch sphere.', 'Rᵧ(θ)', 'Rᵧ(θ)|ψ⟩ = rotated state', 'Use it for continuous y-axis rotations.'],
  rz: ['RZ Gate', 'RZ rotates a qubit around the z-axis of the Bloch sphere.', 'R𝓏(θ)', 'R𝓏(θ)|ψ⟩ = rotated state', 'Use it for continuous phase rotations.'],
  cnot: ['CNOT', 'The controlled-NOT flips the target qubit only when the control is |1⟩.', 'CNOT|10⟩ = |11⟩', '|00⟩ → |00⟩,  |10⟩ → |11⟩', 'Use it to conditionally flip a target and create entanglement with H.'],
  cz: ['CZ', 'The controlled-Z applies a phase flip only when both qubits are |1⟩.', 'CZ|11⟩ = −|11⟩', '|00⟩ → |00⟩,  |11⟩ → −|11⟩', 'Use it for controlled phase relationships.'],
  swap: ['SWAP', 'The SWAP gate exchanges the states of two qubits.', 'SWAP|01⟩ = |10⟩', '|ab⟩ → |ba⟩', 'Use it to reorder qubits in a circuit.'],
  toffoli: ['Toffoli', 'The Toffoli gate flips a target only when both control qubits are |1⟩.', '|110⟩ → |111⟩', '|100⟩ → |100⟩,  |110⟩ → |111⟩', 'Use it for controlled-controlled logic and reversible computation.'],
  universal: ['Universal Gates', 'A universal gate set can approximate any quantum computation when its gates are combined appropriately.', '{H, T, CNOT}', 'H creates superposition, T supplies phase precision, and CNOT links qubits.', 'Use a universal set as a compact vocabulary for building algorithms.'],
  circuits: ['Gates in Quantum Circuits', 'A circuit is a sequence of gates that transforms initialized qubits and ends with measurement.', 'Qubit → Gate → Circuit → Algorithm', 'Initialize → Apply Gates → Superposition/Entanglement → Interference → Measure → Classical Result', 'Use circuits to compose individual operations into algorithms.']
};

function legacyGatePageTemplate(page) {
  if (page === 'introduction') return quantumGatesLessonTemplate();
  const info = gatePageInfo[page];
  if (page === 'single' || page === 'multi') return `<section class="qubit-lesson gates-lesson"><div class="qubit-section"><h2>${info[0]}</h2><p>${info[1]}</p><p>${page === 'single' ? 'A single-qubit gate acts on amplitudes for |0⟩ and |1⟩ using a 2 × 2 unitary matrix. Its columns show the output for each basis input, while superpositions are transformed by linearity. X and Y flip basis states, Z/S/T adjust phase, H changes basis, and rotations give continuous control.' : 'For two qubits, the joint basis is |00⟩, |01⟩, |10⟩, and |11⟩, so a gate transforms four amplitudes together. CNOT and CZ make an operation conditional on both qubits; SWAP exchanges their states. Controlled gates can create entanglement when the input is a suitable superposition.'}</p><div class="gate-index-list">${(page === 'single' ? gateGroups[1].children : gateGroups[2].children).map((gate) => `<div><strong>${gate.title}</strong><span>Open this focused gate lesson from the sidebar.</span></div>`).join('')}</div></div><aside class="key-idea"><span class="card-label">Key takeaway</span><p>Each gate is a precise, reversible transformation that can be combined with other gates in a circuit.</p></aside></section>`;
  if (page === 'circuits') return `<section class="qubit-lesson gates-lesson"><div class="qubit-section"><h2>${info[0]}</h2><p>${info[1]}</p><div class="qubit-equation">${info[2]}</div><div class="circuit-sketch"><div>q₀: ── |0⟩ ── H ── Z ── Measure</div><div>q₁: ── |0⟩ ── ● ── ⊕ ── Measure</div></div><div class="state-flow math-flow"><span>${info[3]}</span></div><p>${info[4]}</p></div><aside class="key-idea"><span class="card-label">Key takeaway</span><p>Circuits make a sequence of reversible gate operations visible and measurable.</p></aside></section>`;
  return `<section class="qubit-lesson gates-lesson"><div class="qubit-section"><h2>${info[0]}</h2><p>${info[1]}</p><div class="qubit-equation">${info[2]}</div><p><strong>Action on basis states:</strong> ${info[3]}</p><div class="circuit-line-simple"><span>|ψ⟩</span><i>───</i><strong>${info[0].replace(' Gate', '')}</strong><i>───</i><span>|ψ'⟩</span></div><p><strong>Practical use:</strong> ${info[4]}</p><p class="gate-use">Bloch-sphere view: single-qubit gates can be understood as rotations or reflections of the state vector.</p></div><aside class="key-idea"><span class="card-label">Key takeaway</span><p>${info[0]} is a controlled, reversible transformation represented by a matrix.</p></aside></section>`;
}

function legacyGatePageContentTemplate(page) {
  if (page === 'introduction') return quantumGatesLessonTemplate();
  const pages = {
    single: ['Single-Qubit Gates', 'Single-qubit gates transform one two-state quantum system.', 'The X, Y, Z, H, S, T, and rotation gates are the basic tools for changing amplitudes and phase.'],
    multi: ['Multi-Qubit Gates', 'Multi-qubit gates coordinate two or more quantum systems.', 'Control and target behavior lets these gates create correlations and entanglement.'],
    x: ['X Gate', 'The X gate is the quantum bit flip.', 'It exchanges the computational basis states and is the quantum analogue of a classical NOT.'],
    y: ['Y Gate', 'The Y gate combines a bit flip with a phase flip.', 'It changes the basis state and introduces a phase factor.'],
    z: ['Z Gate', 'The Z gate is a phase flip.', 'It leaves |0⟩ unchanged and changes the sign of |1⟩.'],
    h: ['Hadamard Gate', 'The Hadamard gate creates and reverses equal superposition.', 'It changes between the computational basis and the plus/minus basis.'],
    s: ['S Gate', 'The S gate applies a quarter-turn phase rotation.', 'It adds a π/2 relative phase to |1⟩.'],
    t: ['T Gate', 'The T gate applies a smaller phase rotation.', 'It adds a π/4 relative phase to |1⟩.'],
    rotations: ['Rotation Gates', 'Rotation gates move a qubit around the Bloch sphere.', 'RX, RY, and RZ rotate around the x-, y-, and z-axes.'],
    rx: ['RX Gate', 'RX rotates a qubit around the x-axis of the Bloch sphere.', 'Continuous x-axis rotation.'],
    ry: ['RY Gate', 'RY rotates a qubit around the y-axis of the Bloch sphere.', 'Continuous y-axis rotation.'],
    rz: ['RZ Gate', 'RZ rotates a qubit around the z-axis of the Bloch sphere.', 'Continuous z-axis rotation.'],
    cnot: ['CNOT', 'CNOT is a controlled bit flip.', 'It flips the target qubit only when the control qubit is |1⟩.'],
    cz: ['CZ', 'CZ is a controlled phase gate.', 'It applies a phase flip only to the |11⟩ state.'],
    swap: ['SWAP', 'SWAP exchanges the states of two qubits.', 'It moves the first qubit state to the second wire and vice versa.'],
    toffoli: ['Toffoli', 'Toffoli is a controlled-controlled-NOT gate.', 'It flips a target only when both control qubits are |1⟩.'],
    universal: ['Universal Gates', 'A universal gate set can build any quantum computation to the desired precision.', 'The set {H, T, CNOT} combines basis changes, phase control, and entanglement.'],
    circuits: ['Gates in Quantum Circuits', 'A quantum circuit is a sequence of gates applied from left to right.', 'Circuits turn individual matrix operations into complete computations.']
  };
  const [title, intro, summary] = pages[page];
  const details = {
    x: ['X = [0  1; 1  0]', 'X = [0  1; 1  0]', 'X|0⟩ = |1⟩, X|1⟩ = |0⟩', '|0⟩ ─── X ─── |1⟩', 'Use for bit flips and basis-state toggles.'],
    y: ['Y = [0  −i; i  0]', 'Y = [0  −i; i  0]', 'Y|0⟩ = i|1⟩, Y|1⟩ = −i|0⟩', '|0⟩ ─── Y ─── i|1⟩', 'Use for combined bit and phase transformations.'],
    z: ['Z = [1  0; 0  −1]', 'Z = [1  0; 0  −1]', 'Z|0⟩ = |0⟩, Z|1⟩ = −|1⟩', '|1⟩ ─── Z ─── −|1⟩', 'Use for relative phase changes; on the Bloch sphere it is a half-turn around z.'],
    h: ['H = 1/√2 [1  1; 1  −1]', 'H = 1/√2 [1  1; 1  −1]', 'H|0⟩ = (|0⟩ + |1⟩)/√2', '|0⟩ ─── H ─── |+⟩', 'Use for basis changes and creating superposition.'],
    s: ['S = [1  0; 0  i]', 'S = [1  0; 0  i]', 'S|0⟩ = |0⟩, S|1⟩ = i|1⟩', '|1⟩ ─── S ─── i|1⟩', 'Use for a π/2 phase rotation.'],
    t: ['T = [1  0; 0  e^(iπ/4)]', 'T = [1  0; 0  e^(iπ/4)]', 'T|0⟩ = |0⟩, T|1⟩ = e^(iπ/4)|1⟩', '|1⟩ ─── T ─── e^(iπ/4)|1⟩', 'Use for fine phase control in universal circuits.'],
    rotations: ['RX(θ), RY(θ), RZ(θ)', 'RX(θ), RY(θ), RZ(θ)', 'Each gate rotates a state around its named Bloch-sphere axis.', '|ψ⟩ ─── Rₓ/Rᵧ/R𝓏 ─── |ψ′⟩', 'Use for continuous control of amplitudes and phase.'],
    cnot: ['CNOT', 'CNOT = controlled-X', '|10⟩ → |11⟩, |00⟩ → |00⟩', 'q₀: ── ● ──\nq₁: ── ⊕ ──', 'Use for controlled flips and entanglement.'],
    cz: ['CZ', 'CZ = diag(1, 1, 1, −1)', 'CZ|11⟩ = −|11⟩; other basis states stay unchanged.', 'q₀: ── ● ──\nq₁: ── ● ──', 'Use for controlled phase changes.'],
    swap: ['SWAP', 'SWAP', 'SWAP|01⟩ = |10⟩', 'q₀: ── × ──\nq₁: ── × ──', 'Use to exchange states between circuit wires.'],
    toffoli: ['CCNOT', 'Toffoli = controlled-controlled-X', '|110⟩ → |111⟩; |100⟩ → |100⟩', 'q₀: ── ● ──\nq₁: ── ● ──\nq₂: ── ⊕ ──', 'Use for reversible logic with two controls.']
  };
  if (details[page]) {
    const [matrix, equation, transform, circuit, use] = details[page];
    return `<section class="gates-lesson math-lesson gate-detail"><div class="qubit-section"><h2>${title}</h2><p>${intro} ${summary}</p><div class="qubit-equation">${matrix}</div><p><strong>Matrix representation:</strong> ${equation}</p><p><strong>Action on basis states:</strong> ${transform}</p><div class="circuit-sketch">${circuit.replace(/\n/g, '<br>')}</div><p><strong>Practical use:</strong> ${use}</p><p class="gate-takeaway">Key takeaway: ${summary}</p></div></section>`;
  }
  if (page === 'universal') return `<section class="gates-lesson math-lesson gate-detail"><div class="qubit-section"><h2>${title}</h2><p>${intro} ${summary}</p><div class="qubit-equation">{H, T, CNOT}</div><div class="gate-comparison"><div><strong>Gate</strong><strong>Role</strong></div><div><span>H</span><span>Basis change and superposition</span></div><div><span>T</span><span>Fine phase control</span></div><div><span>CNOT</span><span>Controlled operations and entanglement</span></div></div><p>Together, these gates form a compact universal set. More complex operations can be built by composing them.</p><p class="gate-takeaway">Key takeaway: a universal set provides the building blocks for arbitrary quantum algorithms.</p></div></section>`;
  if (page === 'circuits') return `<section class="gates-lesson math-lesson gate-detail"><div class="qubit-section">
    <h2>${title}</h2>
    <p>${intro} ${summary}</p>
    <div class="gate-section"><h3>What Is a Quantum Circuit?</h3>
      <p>A quantum circuit is both a diagram and an execution plan for a quantum computation. It begins with initialized qubits, applies a precisely ordered sequence of quantum gates, and usually ends by measuring the qubits. Each wire represents a qubit, and time conventionally runs from left to right.</p>
      <p>A gate is represented by a unitary matrix <em>U</em> that transforms a state:</p>
      <div class="qubit-equation">|ψ'⟩ = U|ψ⟩</div>
      <p>For a sequence of gates, the rightmost operation acts first in the matrix expression:</p>
      <div class="qubit-equation">|ψ<sub>f</sub>⟩ = U<sub>n</sub>...U<sub>2</sub>U<sub>1</sub>|ψ<sub>i</sub>⟩</div>
    </div>
    <div class="gate-section"><h3>How Gates Are Arranged and Applied</h3>
      <ul><li><strong>Wires</strong> carry qubits through the circuit.</li><li><strong>Gates placed one after another</strong> act sequentially, from left to right.</li><li><strong>Gates in the same vertical column</strong> act at the same circuit step on different wires, when they do not conflict.</li><li><strong>Multi-qubit gates</strong> connect wires and act on their joint state.</li></ul>
      <p>This one-qubit circuit initializes |0⟩, applies H and Z, then measures:</p>
      <pre class="circuit-sketch">q₀: |0⟩ ── H ── Z ── M</pre>
    </div>
    <div class="gate-section"><h3>Single-Qubit and Multi-Qubit Circuits</h3>
      <p>A <strong>single-qubit circuit</strong> uses operations such as H, X, and Z on one qubit. H can turn |0⟩ into an equal superposition; X swaps |0⟩ and |1⟩; Z leaves |0⟩ unchanged and multiplies the |1⟩ component by −1. Z changes relative phase, which can affect later interference even if an immediate computational-basis measurement has unchanged probabilities.</p>
      <p>A <strong>multi-qubit circuit</strong> includes gates acting on two or more qubits. CNOT has a control (●) and target (⊕): it flips the target only when the control is |1⟩. Multi-qubit gates can create entanglement for suitable inputs and gate sequences, but not every multi-qubit circuit does so.</p>
      <pre class="circuit-sketch">q₀: |0⟩ ── H ── ● ── M
                  │
q₁: |0⟩ ──────── ⊕ ── M</pre>
    </div>
    <div class="gate-section"><h3>From Initialization to a Classical Result</h3>
      <div class="state-flow math-flow"><span>Initialize</span><b>→</b><span>Apply Gates</span><b>→</b><span>Superposition / possible entanglement</span><b>→</b><span>Interference</span><b>→</b><span>Measure</span><b>→</b><strong>Classical Result</strong></div>
      <ul><li><strong>Initialization:</strong> hardware commonly prepares qubits in |0⟩; gates can prepare other states.</li><li><strong>Gates:</strong> unitary operations transform amplitudes and relative phases without measuring the qubits.</li><li><strong>Superposition:</strong> a qubit may have amplitudes for both |0⟩ and |1⟩, such as H|0⟩ = (|0⟩ + |1⟩)/√2.</li><li><strong>Entanglement:</strong> a joint state can have correlations that cannot be described as separate states for each qubit.</li><li><strong>Interference:</strong> amplitudes can reinforce or cancel as later gates combine them, shaping outcome probabilities.</li><li><strong>Measurement:</strong> converts the quantum state into a sampled classical bit string, such as 0, 1, 00, or 11.</li></ul>
    </div>
    <div class="gate-section"><h3>Example: Creating a Bell State with H and CNOT</h3>
      <p>Start with two initialized qubits, |00⟩. Apply H to q₀, then CNOT with q₀ as control and q₁ as target:</p>
      <div class="qubit-equation">|00⟩ → (|00⟩ + |10⟩)/√2 → (|00⟩ + |11⟩)/√2</div>
      <p>The final state is a Bell state. Measuring in the computational basis produces 00 or 11 with equal probability: each individual result is random, but the pair is correlated. Repeated runs let a classical computer estimate these probabilities from recorded outcomes.</p>
    </div>
    <div class="gate-section"><h3>State, Gate, Circuit, and Algorithm</h3>
      <ul><li><strong>Quantum state:</strong> the mathematical description of one or more qubits at a moment, for example |0⟩ or (|00⟩ + |11⟩)/√2.</li><li><strong>Quantum gate:</strong> one reversible operation, represented by a unitary matrix.</li><li><strong>Quantum circuit:</strong> an ordered arrangement of gates and measurements acting on initialized qubits.</li><li><strong>Quantum algorithm:</strong> a larger problem-solving method specifying circuits, inputs, repetitions, and interpretation of classical results.</li></ul>
      <p><strong>Qubit → Gate → Circuit → Algorithm</strong></p>
    </div>
    <div class="gate-section"><h3>Measurement: Quantum to Classical Information</h3>
      <p>Before measurement, a state is described by amplitudes. Measurement in the computational basis returns one definite classical outcome, with probabilities given by the squared magnitudes of those amplitudes. Measuring (|0⟩ + |1⟩)/√2 returns either 0 or 1; one run gives one bit. The measurement device records that bit so ordinary software can store, count, and process it. Because measurement is probabilistic, circuits are commonly run repeatedly.</p>
    </div>
    <p class="gate-takeaway"><strong>Key Takeaway:</strong> A quantum circuit is an ordered sequence of gates that transforms initialized quantum states and produces classical measurement data. Gates control amplitudes, phase, interference, and—when the inputs and operations allow it—entanglement; an algorithm uses circuits and repeated results to solve a problem.</p>
  </div></section>`;
  return `<section class="gates-lesson math-lesson gate-detail"><div class="qubit-section"><h2>${title}</h2><p>${intro} ${summary}</p>${page === 'single' ? '<p>A single-qubit state is a pair of amplitudes, α|0⟩ + β|1⟩. The gate’s 2 × 2 matrix multiplies this vector to produce new amplitudes; each matrix column gives the output for one basis input. X and Y change basis states, H creates or reverses superposition, and Z, S, and T change relative phase. Rotation gates provide angle-based control.</p><p>In practice, these gates prepare input states, change measurement bases, and shape interference in algorithms. A phase change may leave immediate measurement probabilities alone, but a later gate can turn it into a measurable difference.</p>' : page === 'multi' ? '<p>For two qubits, a state has four amplitudes, one for each of |00⟩, |01⟩, |10⟩, and |11⟩. CNOT flips its target only when the control is 1; CZ changes the sign of |11⟩; SWAP exchanges the qubits’ states. These rules describe how the gate transforms every basis component and therefore any superposition of them.</p><p>Use CNOT or CZ to build conditional relationships and entangled states, and use SWAP to move quantum information between wires. The output is a joint state, so measurement outcomes can be correlated.</p>' : ''}</div></section>`;
}

const legacyGateLearningExamples = {
  x: { title: 'X Gate', intro: 'The X gate flips a qubit between |0⟩ and |1⟩.', theory: 'X|0⟩ = |1⟩, &nbsp; X|1⟩ = |0⟩', matrix: 'X = [0  1; 1  0]', circuit: '|0⟩ ─── X ─── |1⟩', code: 'from sia import HDQS\nq = HDQS(1)\nq.x(0)\nq.show_state()', output: 'X(0)\nState Amplitude Prob\n---------------------------------------\n|1> 1.000+0.000i 100.0%', interpretation: 'The qubit starts in |0⟩. After X is applied, it is in |1⟩ with probability 100%.' },
  y: { title: 'Y Gate', intro: 'The Y gate combines a bit flip with a phase factor.', theory: 'Y|0⟩ = i|1⟩, &nbsp; Y|1⟩ = −i|0⟩', matrix: 'Y = [0  −i; i  0]', circuit: '|0⟩ ─── Y ─── i|1⟩', code: 'from sia import HDQS\nq = HDQS(1)\nq.y(0)\nq.show_state()', output: 'Output example not explicitly provided in the reference excerpt.', interpretation: 'Y changes the basis state and also changes its phase. The output should be read as a state amplitude, not only as a classical bit value.' },
  z: { title: 'Z Gate', intro: 'The Z gate flips the phase of |1⟩ while leaving |0⟩ unchanged.', theory: 'Z|0⟩ = |0⟩, &nbsp; Z|1⟩ = −|1⟩', matrix: 'Z = [1  0; 0  −1]', circuit: '|1⟩ ─── Z ─── −|1⟩', code: 'from sia import HDQS\nq = HDQS(1)\nq.z(0)\nq.show_state()', output: 'Output example not explicitly provided in the reference excerpt.', interpretation: 'Z does not change computational-basis probabilities by itself; it changes the relative phase of the |1⟩ component.' },
  h: { title: 'Hadamard Gate', intro: 'The Hadamard gate changes between the computational basis and an equal superposition.', theory: 'H|0⟩ = (|0⟩ + |1⟩)/√2', matrix: 'H = 1/√2 [1  1; 1  −1]', circuit: '|0⟩ ─── H ─── |+⟩', code: 'from sia import HDQS\nq = HDQS(1)\nq.h(0)\nq.show_state()', output: 'H(0)\nState Amplitude Prob\n---------------------------------------\n|0> 0.707+0.000i 50.0%\n|1> 0.707+0.000i 50.0%', interpretation: 'The initial |0⟩ state becomes an equal superposition. Each basis state has amplitude 0.707 and probability 50%.' },
  s: { title: 'S Gate', intro: 'The S gate applies a quarter-turn of relative phase.', theory: 'S|0⟩ = |0⟩, &nbsp; S|1⟩ = i|1⟩', matrix: 'S = [1  0; 0  i]', circuit: '|1⟩ ─── S ─── i|1⟩', code: 'from sia import HDQS\nq = HDQS(1)\nq.s(0)\nq.show_state()', output: 'Output example not explicitly provided in the reference excerpt.', interpretation: 'S keeps the basis probabilities the same while rotating the phase of the |1⟩ component by π/2.' },
  t: { title: 'T Gate', intro: 'The T gate applies a smaller phase rotation than S.', theory: 'T|0⟩ = |0⟩, &nbsp; T|1⟩ = e^(iπ/4)|1⟩', matrix: 'T = [1  0; 0  e^(iπ/4)]', circuit: '|1⟩ ─── T ─── e^(iπ/4)|1⟩', code: 'from sia import HDQS\nq = HDQS(1)\nq.t(0)\nq.show_state()', output: 'Output example not explicitly provided in the reference excerpt.', interpretation: 'T changes relative phase without changing the computational-basis probability of a basis state.' },
  rx: { title: 'RX Gate', intro: 'RX rotates a qubit around the x-axis of the Bloch sphere.', theory: 'Rₓ(θ) = cos(θ/2)I − i sin(θ/2)X', matrix: 'Rₓ(θ)', circuit: '|ψ⟩ ─── RX(θ) ─── |ψ′⟩', code: 'from sia import HDQS\nimport numpy as np\nq = HDQS(1)\nq.rx(0, np.pi/2)\nq.show_state()', output: 'Output example not explicitly provided in the reference excerpt.', interpretation: 'The angle π/2 rotates the state around the Bloch-sphere x-axis.' },
  ry: { title: 'RY Gate', intro: 'RY rotates a qubit around the y-axis of the Bloch sphere.', theory: 'Rᵧ(θ) = cos(θ/2)I − i sin(θ/2)Y', matrix: 'Rᵧ(θ)', circuit: '|ψ⟩ ─── RY(θ) ─── |ψ′⟩', code: 'from sia import HDQS\nimport numpy as np\nq = HDQS(1)\nq.ry(0, np.pi/2)\nq.show_state()', output: 'Output example not explicitly provided in the reference excerpt.', interpretation: 'The angle π/2 rotates the state around the Bloch-sphere y-axis.' },
  rz: { title: 'RZ Gate', intro: 'RZ rotates a qubit around the z-axis and changes relative phase.', theory: 'R𝓏(θ) = cos(θ/2)I − i sin(θ/2)Z', matrix: 'R𝓏(θ)', circuit: '|ψ⟩ ─── RZ(θ) ─── |ψ′⟩', code: 'from sia import HDQS\nimport numpy as np\nq = HDQS(1)\nq.h(0)\nq.rz(0, np.pi/2)\nq.show_state()', output: 'Output example not explicitly provided in the reference excerpt.', interpretation: 'The Hadamard state makes the relative phase visible; RZ then rotates that phase around the z-axis.' },
  cnot: { title: 'CNOT Gate', intro: 'CNOT flips the target qubit only when the control qubit is |1⟩.', theory: '|00⟩ → |00⟩, &nbsp; |10⟩ → |11⟩', matrix: 'CNOT|10⟩ = |11⟩', circuit: 'q₀: ── ● ──\nq₁: ── ⊕ ──', code: 'from sia import HDQS\nq = HDQS(2)\nq.h(0)\nq.cnot(0, 1)\nq.show_state()', output: 'H(0)\nCNOT(0,1)\nState Amplitude Prob\n---------------------------------------\n|00> 0.707+0.000i 50.0%\n|11> 0.707+0.000i 50.0%', interpretation: 'H creates control superposition. CNOT correlates the target, producing the Bell state (|00⟩ + |11⟩)/√2.' },
  cz: { title: 'CZ Gate', intro: 'CZ applies a phase flip only when both qubits are |1⟩.', theory: 'CZ|11⟩ = −|11⟩', matrix: 'CZ = diag(1, 1, 1, −1)', circuit: 'q₀: ── ● ──\nq₁: ── ● ──', code: 'from sia import HDQS\nq = HDQS(2)\nq.h(0)\nq.h(1)\nq.cz(0, 1)\nq.show_state()', output: 'Output example not explicitly provided in the reference excerpt.', interpretation: 'CZ leaves the basis probabilities in place while changing the phase of the joint |11⟩ component.' },
  swap: { title: 'SWAP Gate', intro: 'SWAP exchanges the states of two qubits.', theory: 'SWAP|01⟩ = |10⟩', matrix: 'SWAP|ab⟩ = |ba⟩', circuit: 'q₀: ── × ──\nq₁: ── × ──', code: 'from sia import HDQS\nq = HDQS(2)\nq.x(0)\nq.swap(0, 1)\nq.show_state()', output: 'X(0)\nSWAP(0,1)\nState Amplitude Prob\n---------------------------------------\n|01> 1.000+0.000i 100.0%', interpretation: 'The initial excitation moves from the first qubit to the second, so the final state is |01⟩.' }
};

function gateCodeExplanation(page) {
  const shared = ['from sia import HDQS → Imports the HDQS quantum simulation interface from SIA Script.', 'q = HDQS(n) → Creates an n-qubit system initialized in the all-zero state.', 'q.show_state() → Displays the state amplitudes and measurement probabilities.'];
  const operations = { x: 'q.x(0) → Applies the X bit-flip gate to qubit 0.', y: 'q.y(0) → Applies the Y gate, changing the basis state and phase.', z: 'q.z(0) → Applies the Z phase-flip gate to qubit 0.', h: 'q.h(0) → Applies the Hadamard gate, creating an equal superposition from |0⟩.', s: 'q.s(0) → Applies a quarter-turn phase rotation to qubit 0.', t: 'q.t(0) → Applies a π/4 phase rotation to qubit 0.', rx: 'q.rx(0, np.pi/2) → Rotates qubit 0 around the x-axis by π/2.', ry: 'q.ry(0, np.pi/2) → Rotates qubit 0 around the y-axis by π/2.', rz: 'q.rz(0, np.pi/2) → Rotates qubit 0 around the z-axis by π/2.', cnot: 'q.h(0) → Places the control qubit into superposition.\nq.cnot(0, 1) → Flips target qubit 1 when control qubit 0 is |1⟩.', cz: 'q.h(0) and q.h(1) → Prepare both qubits for the controlled phase operation.\nq.cz(0, 1) → Applies a phase flip to the joint |11⟩ component.', swap: 'q.x(0) → Places the first qubit in |1⟩.\nq.swap(0, 1) → Exchanges the states on qubits 0 and 1.' }; return [...(page === 'rx' || page === 'ry' || page === 'rz' ? ['import numpy as np → Imports π and numerical constants for the rotation angle.'] : []), ...(operations[page] ? [operations[page]] : []), ...shared];
}

function gateOutputExplanation(page) {
  const explanations = { x: '|1> → The final state is |1⟩. 1.000+0.000i → Its amplitude. 100.0% → Measuring gives |1⟩ with certainty.', h: '|0> and |1> → Both basis states remain possible. 0.707+0.000i → Each amplitude is approximately 1/√2. 50.0% → Each outcome has equal probability.', cnot: '|00> and |11> → The correlated outcomes of the Bell state. 0.707+0.000i → Each has amplitude 1/√2. 50.0% → The pair is measured as either outcome with equal probability.', swap: '|01> → The excitation moved to the second qubit. 1.000+0.000i → The final state amplitude. 100.0% → The exchange is deterministic.' }; return explanations[page] || 'The output panel is reserved for the documented HDQS result. Where the reference does not provide a complete output, no values are invented.'; }

function legacyGatePageTemplateV1(page) {
  if (page === 'introduction') return quantumGatesLessonTemplate();
  const example = gateLearningExamples[page];
  if (!example) return legacyGatePageContentTemplate(page);
  const codeExplanation = gateCodeExplanation(page).map((line) => `<li>${line.replace(/\n/g, '<br>')}</li>`).join('');
  return `<section class="gates-lesson math-lesson gate-detail"><div class="qubit-section"><h2>${example.title}</h2><h3>Gate Introduction</h3><p>${example.intro}</p><h3>What Does This Gate Do?</h3><p>${example.interpretation}</p><h3>Mathematical Representation</h3><div class="qubit-equation">${example.matrix}</div><p>The matrix describes how the gate maps input amplitudes to output amplitudes.</p><h3>State Transformation</h3><p>${example.theory}</p><h3>Circuit Visualization</h3><div class="circuit-sketch">${example.circuit.replace(/\n/g, '<br>')}</div><h3>HDQS Code</h3><pre class="hdqs-code"><code>${example.code}</code></pre><h3>Code Explanation</h3><ul class="code-explanation">${codeExplanation}</ul><h3>HDQS Output</h3><pre class="hdqs-output"><code>${example.output}</code></pre><h3>Output Explanation</h3><p>${gateOutputExplanation(page)}</p><h3>Interpretation</h3><p>${example.interpretation}</p><p class="gate-takeaway"><strong>Key Takeaway</strong><br>${example.intro}</p></div></section>`;
}

const gateLessons = {
  x: { title: 'X Gate', overview: 'The X gate is the quantum bit-flip gate. It exchanges |0⟩ and |1⟩, much like a classical NOT operation. It is useful whenever a circuit needs to toggle a qubit between its two computational-basis states.', matrix: 'X = [ [0, 1], [1, 0] ]', transforms: ['X|0⟩ = |1⟩', 'X|1⟩ = |0⟩'], code: 'from sia import HDQS\n\nq = HDQS(1)\nq.x(0)\nq.show_state()', output: 'X(0)\nState Amplitude Prob\n---------------------------------------\n|1> 1.000+0.000i 100.0%', outputExplanation: 'The only displayed basis state is |1⟩, because the initial |0⟩ was flipped. Its amplitude 1.000+0.000i has magnitude 1, so probability = |amplitude|² = 1, or 100%.', takeaway: 'X deterministically flips |0⟩ to |1⟩ and |1⟩ to |0⟩. It is the quantum analogue of a classical NOT gate.' },
  y: { title: 'Y Gate', overview: 'The Y gate combines a bit flip with a phase change. It maps |0⟩ to i|1⟩ and |1⟩ to −i|0⟩, so it is useful when both the computational state and its phase need to change.', matrix: 'Y = [ [0, −i], [i, 0] ]', transforms: ['Y|0⟩ = i|1⟩', 'Y|1⟩ = −i|0⟩'], code: 'from sia import HDQS\n\nq = HDQS(1)\nq.y(0)\nq.show_state()', output: 'Y(0)\nState Amplitude Prob\n---------------------------------------\n|1> 0.000+1.000i 100.0%', outputExplanation: 'The basis state becomes |1⟩. The amplitude is purely imaginary, 0.000+1.000i, but its magnitude is still 1; therefore measurement returns |1⟩ with 100% probability. The i factor is phase information, not an extra measurement outcome.', takeaway: 'Y flips the basis state and adds an imaginary phase. Phase can matter to later interference even when this measurement probability is unchanged.' },
  z: { title: 'Z Gate', overview: 'The Z gate is a phase-flip gate. It leaves |0⟩ unchanged and multiplies the |1⟩ component by −1. This makes it useful for marking or controlling relative phase without changing computational-basis probabilities.', matrix: 'Z = [ [1, 0], [0, −1] ]', transforms: ['Z|0⟩ = |0⟩', 'Z|1⟩ = −|1⟩'], code: 'from sia import HDQS\n\nq = HDQS(1)\nq.h(0)\nq.z(0)\nq.show_state()', output: 'H(0)\nZ(0)\nState Amplitude Prob\n---------------------------------------\n|0> 0.707+0.000i 50.0%\n|1> -0.707+0.000i 50.0%', outputExplanation: 'H first gives |0⟩ and |1⟩ equal amplitudes. Z leaves the |0⟩ amplitude unchanged and changes the sign of the |1⟩ amplitude. Both amplitudes have magnitude about 1/√2, so both probabilities remain 50%; only their relative phase changed.', takeaway: 'Z changes phase, not computational-basis probability. Its minus sign becomes observable when a later gate lets amplitudes interfere.' },
  h: { title: 'Hadamard (H) Gate', overview: 'The Hadamard gate is a primary superposition gate. From |0⟩, it prepares equal amplitudes for |0⟩ and |1⟩; from |1⟩, it prepares the same pair with a relative minus sign. It is useful for creating superposition and changing basis.', matrix: 'H = (1/√2) [ [1, 1], [1, −1] ]', transforms: ['H|0⟩ = (|0⟩ + |1⟩)/√2', 'H|1⟩ = (|0⟩ − |1⟩)/√2'], code: 'from sia import HDQS\n\nq = HDQS(1)\nq.h(0)\nq.show_state()', output: 'H(0)\nState Amplitude Prob\n---------------------------------------\n|0> 0.707+0.000i 50.0%\n|1> 0.707+0.000i 50.0%', outputExplanation: 'Both |0⟩ and |1⟩ are present. Each amplitude is approximately 0.707 = 1/√2, and |0.707|² is 0.5. A measurement therefore produces either basis state with 50% probability.', takeaway: 'H turns a basis state into an equal superposition. It creates amplitudes for both outcomes; measurement still returns just one outcome.' },
  s: { title: 'S Gate', overview: 'The S gate is a π/2 phase rotation around the Z axis. It leaves |0⟩ unchanged and multiplies |1⟩ by i, preserving probabilities while changing relative phase. It is also called the square root of Z because S² = Z.', matrix: 'S = [ [1, 0], [0, i] ]', transforms: ['S|0⟩ = |0⟩', 'S|1⟩ = i|1⟩', 'S² = Z'], code: 'from sia import HDQS\n\nq = HDQS(1)\nq.h(0)\nq.s(0)\nq.show_state()', output: 'H(0)\nS(0)\nState Amplitude Prob\n---------------------------------------\n|0> 0.707+0.000i 50.0%\n|1> 0.000+0.707i 50.0%', outputExplanation: 'The |0⟩ component remains real. The |1⟩ component gains the phase factor i, becoming purely imaginary. Both amplitudes still have magnitude 0.707, so each basis state has 50% measurement probability.', takeaway: 'S adds a quarter-turn of phase to |1⟩ while preserving probabilities. Applying S twice gives the Z phase flip.' },
  t: { title: 'T Gate', overview: 'The T gate is a π/4 phase rotation. It leaves |0⟩ unchanged and multiplies |1⟩ by e^(iπ/4), making it useful for fine phase control in quantum circuits. Two T gates equal one S gate: T² = S.', matrix: 'T = [ [1, 0], [0, e^(iπ/4)] ]', transforms: ['T|0⟩ = |0⟩', 'T|1⟩ = e^(iπ/4)|1⟩', 'T² = S'], code: 'from sia import HDQS\n\nq = HDQS(1)\nq.h(0)\nq.t(0)\nq.show_state()', output: 'H(0)\nT(0)\nState Amplitude Prob\n---------------------------------------\n|0> 0.707+0.000i 50.0%\n|1> 0.500+0.500i 50.0%', outputExplanation: 'The |0⟩ amplitude is unchanged. The |1⟩ amplitude has equal real and imaginary parts after the π/4 phase rotation. Its magnitude is √(0.5² + 0.5²) = 0.707, so its measurement probability remains 50%.', takeaway: 'T supplies a smaller phase rotation than S. It changes relative phase without changing the probabilities in this example.' },
  rx: { title: 'RX Gate', overview: 'RX(θ) rotates a qubit by angle θ around the X axis of the Bloch sphere. The angle continuously controls the transformation, making RX useful for smoothly changing a state rather than applying only a fixed flip.', matrix: 'RX(θ) = [ [cos(θ/2), −i sin(θ/2)], [−i sin(θ/2), cos(θ/2)] ]', transforms: ['RX(π/2)|0⟩ = (|0⟩ − i|1⟩)/√2'], code: 'from sia import HDQS\nimport numpy as np\n\nq = HDQS(1)\nq.rx(0, np.pi/2)\nq.show_state()', output: 'RX(0, 1.5707963267948966)\nState Amplitude Prob\n---------------------------------------\n|0> 0.707+0.000i 50.0%\n|1> 0.000-0.707i 50.0%', outputExplanation: 'Here θ = π/2 = 1.5707963267948966 radians. The |0⟩ and |1⟩ amplitudes both have magnitude 0.707, producing 50% for each result. The negative imaginary amplitude on |1⟩ records the phase produced by an X-axis rotation.', takeaway: 'RX uses θ to rotate continuously around the X axis. At π/2 it creates equal probabilities with a relative imaginary phase.' },
  ry: { title: 'RY Gate', overview: 'RY(θ) rotates a qubit by angle θ around the Y axis of the Bloch sphere. It is useful for continuously changing the real amplitudes of |0⟩ and |1⟩.', matrix: 'RY(θ) = [ [cos(θ/2), −sin(θ/2)], [sin(θ/2), cos(θ/2)] ]', transforms: ['RY(π/2)|0⟩ = (|0⟩ + |1⟩)/√2'], code: 'from sia import HDQS\nimport numpy as np\n\nq = HDQS(1)\nq.ry(0, np.pi/2)\nq.show_state()', output: 'RY(0, 1.5707963267948966)\nState Amplitude Prob\n---------------------------------------\n|0> 0.707+0.000i 50.0%\n|1> 0.707+0.000i 50.0%', outputExplanation: 'The π/2 rotation creates equal real amplitudes for |0⟩ and |1⟩. Since each amplitude has magnitude 1/√2, each measurement probability is |1/√2|² = 50%.', takeaway: 'RY changes the balance between |0⟩ and |1⟩ through a tunable angle. At π/2 from |0⟩ it creates an equal superposition.' },
  rz: { title: 'RZ Gate', overview: 'RZ(θ) rotates a qubit by angle θ around the Z axis of the Bloch sphere. It changes the relative phase of |0⟩ and |1⟩, so probabilities in the computational basis can remain unchanged while later interference changes.', matrix: 'RZ(θ) = [ [e^(−iθ/2), 0], [0, e^(iθ/2)] ]', transforms: ['RZ(θ)|0⟩ = e^(−iθ/2)|0⟩', 'RZ(θ)|1⟩ = e^(iθ/2)|1⟩'], code: 'from sia import HDQS\nimport numpy as np\n\nq = HDQS(1)\nq.h(0)\nq.rz(0, np.pi/2)\nq.show_state()', output: 'H(0)\nRZ(0, 1.5707963267948966)\nState Amplitude Prob\n---------------------------------------\n|0> 0.500-0.500i 50.0%\n|1> 0.500+0.500i 50.0%', outputExplanation: 'H first produces equal components. With θ = π/2, RZ gives |0⟩ a negative phase and |1⟩ a positive phase. Each complex amplitude has magnitude √(0.5² + 0.5²) = 0.707, so both probabilities stay at 50%.', takeaway: 'RZ changes relative phase around the Z axis. Equal computational-basis probabilities do not mean the quantum states are the same.' },
  cnot: { title: 'CNOT Gate', overview: 'CNOT is a controlled-X gate acting on two qubits. It flips the target only when the control is |1⟩, making it useful for conditional operations and entanglement.', matrix: 'CNOT = [ [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0] ]', transforms: ['|00⟩ → |00⟩', '|01⟩ → |01⟩', '|10⟩ → |11⟩', '|11⟩ → |10⟩'], code: 'from sia import HDQS\n\nq = HDQS(2)\nq.h(0)\nq.cnot(0, 1)\nq.show_state()', output: 'H(0)\nCNOT(0,1)\nState Amplitude Prob\n---------------------------------------\n|00> 0.707+0.000i 50.0%\n|11> 0.707+0.000i 50.0%', outputExplanation: 'H creates a 50–50 superposition of the control. CNOT leaves the |00⟩ branch unchanged and flips the target in the |10⟩ branch, producing |11⟩. The result is the Bell state (|00⟩ + |11⟩)/√2: each listed joint outcome has 50%, while |01⟩ and |10⟩ have 0%.', takeaway: 'CNOT conditionally flips a target qubit. After H on the control, it creates a Bell state and demonstrates entanglement.' },
  cz: { title: 'CZ Gate', overview: 'CZ is a controlled phase-flip gate for two qubits. It changes only the phase of |11⟩ and leaves the other computational-basis states unchanged, making it useful for controlled phase relationships.', matrix: 'CZ = diag(1, 1, 1, −1)', transforms: ['|00⟩ → |00⟩', '|01⟩ → |01⟩', '|10⟩ → |10⟩', '|11⟩ → −|11⟩'], code: 'from sia import HDQS\n\nq = HDQS(2)\nq.h(0)\nq.h(1)\nq.cz(0, 1)\nq.show_state()', output: 'H(0)\nH(1)\nCZ(0,1)\nState Amplitude Prob\n---------------------------------------\n|00> 0.500+0.000i 25.0%\n|01> 0.500+0.000i 25.0%\n|10> 0.500+0.000i 25.0%\n|11> -0.500+0.000i 25.0%', outputExplanation: 'The two Hadamard gates create all four basis states with amplitude 0.500. CZ changes only the sign of |11⟩. Every amplitude has magnitude 0.5, and |0.5|² = 0.25, so each measurement probability is 25%; the minus sign is phase information.', takeaway: 'CZ affects only the phase of |11⟩. It leaves computational-basis probabilities unchanged but can alter later interference.' },
  swap: { title: 'SWAP Gate', overview: 'The SWAP gate exchanges the states of two qubits. It is useful for moving quantum information between circuit wires; it can also be built from three CNOT operations.', matrix: 'SWAP = [ [1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1] ]', transforms: ['|00⟩ → |00⟩', '|01⟩ → |10⟩', '|10⟩ → |01⟩', '|11⟩ → |11⟩'], code: 'from sia import HDQS\n\nq = HDQS(2)\nq.x(0)\nq.swap(0, 1)\nq.show_state()', output: 'X(0)\nSWAP(0,1)\nState Amplitude Prob\n---------------------------------------\n|01> 1.000+0.000i 100.0%', outputExplanation: 'X first puts qubit 0 in |1⟩, giving the joint state |10⟩. SWAP exchanges the two qubit states, yielding |01⟩. Its amplitude has magnitude 1, so this final result is measured with 100% probability.', takeaway: 'SWAP exchanges two qubit states without changing their values. A standard SWAP decomposition uses three CNOT gates.' }
};

const gateImages = {
  x: 'images/x_gate.svg', y: 'images/y_gate.svg', z: 'images/z_gate.svg', h: 'images/h_gate.svg',
  s: 'images/s_gate.svg', t: 'images/t_gate.svg', rx: 'images/rx_gate.svg', ry: 'images/ry_gate.svg',
  rz: 'images/rz_gate.svg', cnot: 'images/cnot_gate.svg', cz: 'images/cz_gate.svg', swap: 'images/swap_gate.svg'
};

function escapeCode(value) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function gatePageTemplate(page) {
  if (page === 'introduction') return quantumGatesLessonTemplate();
  const gate = gateLessons[page];
  if (!gate) return legacyGatePageContentTemplate(page);
  return `<section class="gates-lesson math-lesson gate-detail"><div class="qubit-section">
    <h2>${gate.title}</h2>
    <div class="gate-section"><h3>Gate Overview</h3><p>${gate.overview}</p><figure class="gate-image"><img src="${gateImages[page]}" alt="${gate.title} circuit diagram"></figure></div>
    <div class="gate-section"><h3>Mathematical Representation</h3><div class="qubit-equation">${gate.matrix}</div><p>${gate.transforms.join('<br>')}</p><p>The matrix acts on the input state vector: each output amplitude is a weighted combination of the input amplitudes. Basis-state mappings above show this action directly; phases such as −1 or i affect interference even when immediate measurement probabilities stay the same.</p></div>
    <div class="gate-section"><h3>SIA Script / HDQS Example</h3><pre class="hdqs-code"><code>${escapeCode(gate.code)}</code></pre></div>
    <div class="gate-section"><h3>Code Explanation</h3><p>The example creates a one- or two-qubit HDQS circuit, applies the named gate operations in order, then calls <code>show_state()</code> to display the resulting basis-state amplitudes and probabilities. For rotation examples, <code>np.pi/2</code> supplies the angle θ in radians.</p></div>
    <div class="gate-section"><h3>Expected HDQS Output</h3><pre class="hdqs-output"><code>${escapeCode(gate.output)}</code></pre></div>
    <div class="gate-section"><h3>Output Explanation</h3><p>${gate.outputExplanation}</p></div>
    <div class="gate-section"><h3>Key Takeaway</h3><p class="gate-takeaway">${gate.takeaway}</p></div>
  </div></section>`;
}

function superpositionLessonTemplate() {
  return `<section class="qubit-lesson superposition-lesson">
    <div class="qubit-section"><h2>What is Superposition?</h2><p>Superposition is one of the fundamental properties of quantum mechanics. A qubit can be represented as a combination of its two computational basis states:</p><div class="qubit-equation">|ψ⟩ = α|0⟩ + β|1⟩</div><ul><li><strong>|0⟩</strong> and <strong>|1⟩</strong> are the basis states.</li><li><strong>α</strong> and <strong>β</strong> are probability amplitudes.</li><li><strong>|α|²</strong> represents the probability of measuring 0.</li><li><strong>|β|²</strong> represents the probability of measuring 1.</li></ul><p>The amplitudes must satisfy the normalization condition:</p><div class="qubit-equation">|α|² + |β|² = 1</div></div>
    <div class="qubit-section"><h2>A qubit in superposition</h2><p>A qubit does not have to be only <strong>|0⟩</strong> or <strong>|1⟩</strong> before measurement. For example:</p><div class="qubit-equation">|ψ⟩ = 1/√2 |0⟩ + 1/√2 |1⟩</div><p>This is an equal, or 50–50, superposition.</p><div class="probability-grid"><div><strong>P(0) = 50%</strong><span>Outcome 0</span></div><div><strong>P(1) = 50%</strong><span>Outcome 1</span></div></div></div>
    <div class="qubit-section"><h2>Probability amplitudes</h2><p>Probability amplitudes are the values used to describe the quantum state. Probabilities come from taking the magnitude squared of those amplitudes.</p><div class="amplitude-flow"><span>Amplitude<br><strong>α, β</strong></span><b>↓</b><span>Magnitude squared</span><b>↓</b><span>Probability<br><strong>|α|², |β|²</strong></span></div></div>
    <div class="qubit-section"><h2>Every qubit must be normalized</h2><div class="qubit-equation">|α|² + |β|² = 1</div><p>The probabilities of all possible measurement outcomes must add up to 100%. A different valid state could have:</p><div class="probability-grid"><div><strong>P(0) = 25%</strong><span>|α|² = 0.25</span></div><div><strong>P(1) = 75%</strong><span>|β|² = 0.75</span></div></div></div>
    <div class="qubit-section superposition-interactive"><span class="card-label">TRY IT / 01</span><h2>Stretch a qubit between worlds</h2><p>Drag the slider to change the chance of measuring a 1.</p><label class="probability-slider"><span>0</span><input id="probability-slider" type="range" min="0" max="100" value="50" aria-label="Probability of measuring 1"><span>100</span></label><div class="slider-readout"><strong id="superposition-zero">P(0) = 50%</strong><strong id="superposition-one">P(1) = 50%</strong></div></div>
    <div class="qubit-section"><h2>The 50–50 superposition</h2><div class="qubit-equation">|+⟩ = (|0⟩ + |1⟩) / √2</div><div class="split-flow"><strong>|+⟩</strong><div><i>↙</i><i>↘</i></div><div><em>50%</em><em>50%</em></div><div><span>|0⟩</span><span>|1⟩</span></div></div><p>Measuring this state in the computational basis gives 0 or 1 with equal probability.</p></div>
    <div class="qubit-section"><h2>Creating superposition</h2><p>The Hadamard gate can transform a basis state into an equal superposition:</p><div class="circuit-line-simple"><span>|0⟩</span><i>───</i><strong>H</strong><i>───</i><span>|+⟩</span></div><div class="qubit-equation">H|0⟩ = (|0⟩ + |1⟩) / √2</div><p>The complete behavior of the Hadamard gate belongs in the Quantum Gates lesson.</p></div>
    <div class="qubit-section"><h2>Superposition is not classical uncertainty</h2><div class="comparison-grid"><div><h3>Classical uncertainty</h3><p>A classical bit is already either 0 or 1. We simply do not know which value it has.</p></div><div><h3>Quantum superposition</h3><p>A qubit is described by a quantum state:</p><div class="inline-equation">|ψ⟩ = α|0⟩ + β|1⟩</div><p>The quantum state itself contains amplitudes for the possible outcomes.</p></div></div></div>
    <div class="qubit-section"><h2>What happens when we measure?</h2><div class="measure-flow"><strong>|ψ⟩ = α|0⟩ + β|1⟩</strong><span>↓</span><strong>Measurement</strong><div><i>↙</i><i>↘</i></div><div><em>0</em><em>1</em></div><div><em>|α|²</em><em>|β|²</em></div></div><p>Measurement produces a single classical result. The probabilities are:</p><div class="probability-grid"><div><strong>P(0) = |α|²</strong></div><div><strong>P(1) = |β|²</strong></div></div></div>
    <div class="qubit-section"><h2>Phase matters</h2><p>Relative phase distinguishes quantum states that have the same computational-basis probabilities.</p><div class="phase-grid"><div>|ψ₁⟩ = (|0⟩ + |1⟩) / √2</div><div>|ψ₂⟩ = (|0⟩ − |1⟩) / √2</div></div><p>These states have the same measurement probabilities in this basis, but they are different quantum states because their relative phases are different.</p></div>
    <div class="qubit-section"><h2>Superposition and interference</h2><p>Quantum amplitudes can reinforce or cancel each other as a computation changes the state.</p><div class="state-flow interference-flow"><span>Superposition</span><b>↓</b><strong>Amplitude manipulation</strong><b>↓</b><span>Interference</span><div><em>reinforce</em><em>cancel</em></div></div><p>Quantum algorithms use interference to increase useful outcomes and suppress unwanted outcomes.</p></div>
    <div class="qubit-section"><h2>Why does superposition matter?</h2><p>Superposition allows quantum algorithms to manipulate a quantum state containing amplitudes for multiple computational basis states. The algorithm then uses controlled operations and interference to shape the probability of each measurement outcome.</p></div>
    <aside class="key-idea"><span class="card-label">Key takeaway</span><p>Superposition allows a qubit to be represented as a combination of basis states. The amplitudes determine measurement probabilities, while relative phase influences how quantum states interfere.</p></aside>
  </section>`;
}

function entanglementLessonTemplate() {
  return `<section class="qubit-lesson entanglement-lesson">
    <div class="qubit-section"><h2>Two qubits, one shared state.</h2><p>Unlike independent qubits, entangled qubits can be described by a joint quantum state. Measuring one qubit can reveal a strong correlation with the measurement outcome of another.</p></div>
    <div class="qubit-section"><span class="card-label">EXPLORE / 01</span><h2>A pair that behaves as one</h2><p>Two qubits have four computational basis states:</p><div class="basis-grid entangled-basis"><div><strong>|00⟩</strong></div><div><strong>|01⟩</strong></div><div><strong>|10⟩</strong></div><div><strong>|11⟩</strong></div></div><p>An entangled system is described using a joint state rather than treating the qubits as completely independent.</p><div class="qubit-equation">|Φ⁺⟩ = (|00⟩ + |11⟩) / √2</div><div class="probability-grid"><div><strong>|00⟩ → 50%</strong></div><div><strong>|11⟩ → 50%</strong></div><div><strong>|01⟩ → 0%</strong></div><div><strong>|10⟩ → 0%</strong></div></div></div>
    <div class="qubit-section entanglement-interactive"><span class="card-label">TRY IT / 01</span><h2>See two qubits move together</h2><p>Measure the pair and observe their correlated outcomes.</p><div class="pair-display"><div><span>Qubit A</span><strong id="entangled-qubit-a">|?⟩</strong></div><i>─────────────</i><div><span>Qubit B</span><strong id="entangled-qubit-b">|?⟩</strong></div><small>ENTANGLED</small></div><button class="measure-pair-button" id="measure-entangled-button" type="button">Measure</button><p class="simulation-note" id="entangled-measurement-note">Educational simulation: this pair always returns matching results.</p></div>
    <div class="qubit-section"><h2>Why is entanglement different?</h2><div class="comparison-grid"><div><h3>Classical correlation</h3><p>Two systems can have related values because of how they were prepared.</p></div><div><h3>Quantum entanglement</h3><p>The combined quantum state cannot be written as two independent single-qubit states:</p><div class="inline-equation">|ψ⟩ ≠ |ψ₁⟩ ⊗ |ψ₂⟩</div></div></div></div>
    <div class="qubit-section"><h2>Creating entanglement</h2><p>Quantum gates can create an entangled state. The Hadamard gate creates a superposition, and the CNOT gate links the qubits to produce an entangled state.</p><div class="creation-flow"><span>|00⟩</span><b>↓</b><strong>H</strong><b>↓</b><strong>CNOT</strong><b>↓</b><span>(|00⟩ + |11⟩) / √2</span></div><div class="circuit-sketch"><div>q₀: ── <b>H</b> ── <strong>●</strong> ──</div><div>q₁: ───────── <strong>⊕</strong> ──</div><i>                │</i></div><p>The complete behavior of these gates belongs in the Quantum Gates lesson.</p></div>
    <div class="qubit-section"><h2>Measurement and entanglement</h2><p>For <strong>|Φ⁺⟩ = (|00⟩ + |11⟩) / √2</strong>, the possible results are:</p><div class="probability-grid"><div><strong>|00⟩ → 50%</strong></div><div><strong>|11⟩ → 50%</strong></div></div><p>If the first qubit is measured as 0, the second is also found as 0 for this state. If the first is measured as 1, the second is also found as 1. This is a correlation in the joint quantum state.</p></div>
    <div class="qubit-section"><h2>Entanglement is not faster-than-light communication</h2><p>Entanglement produces strong correlations between measurement outcomes, but it cannot be used by itself to send information faster than light.</p></div>
    <div class="qubit-section"><h2>Why does entanglement matter?</h2><p>Entanglement is an important resource for several areas of quantum technology:</p><ul class="hardware-list"><li>Quantum computing</li><li>Quantum communication</li><li>Quantum teleportation</li><li>Quantum cryptography</li><li>Quantum error correction</li></ul></div>
    <aside class="key-idea"><span class="card-label">Key idea</span><p>Entanglement allows multiple quantum systems to share a joint state whose correlations cannot always be explained by considering each system independently.</p></aside>
  </section>`;
}

function measurementLessonTemplate() {
  return `<section class="qubit-lesson measurement-lesson">
    <div class="qubit-section"><h2>Measurement turns possibilities into outcomes.</h2><p>A qubit can exist in a superposition of <strong>|0⟩</strong> and <strong>|1⟩</strong>. When we measure it, we obtain one definite result: 0 or 1.</p><span class="card-label">EXPLORE / 01</span><div class="measurement-outcome-flow"><div><strong>0</strong><span>|0⟩</span></div><i>or</i><div><strong>1</strong><span>|1⟩</span></div></div><h3>From a quantum state to a result</h3><p>Before measurement, a qubit may contain probability amplitudes for different outcomes. Measurement converts that quantum information into a classical result.</p></div>
    <div class="qubit-section"><h2>Probability of measurement</h2><p>For a qubit:</p><div class="qubit-equation">|ψ⟩ = α|0⟩ + β|1⟩</div><div class="probability-grid"><div><strong>P(0) = |α|²</strong></div><div><strong>P(1) = |β|²</strong></div></div><p><strong>The probabilities must always add up to 1.</strong></p><div class="qubit-equation">|α|² + |β|² = 1</div></div>
    <div class="qubit-section"><h2>A 50–50 measurement</h2><p>For the state:</p><div class="qubit-equation">|+⟩ = (|0⟩ + |1⟩) / √2</div><p>There is a 50% probability of measuring 0 and a 50% probability of measuring 1.</p><div class="probability-grid"><div><strong>P(0) = 50%</strong><span>One possible result</span></div><div><strong>P(1) = 50%</strong><span>The other possible result</span></div></div></div>
    <div class="qubit-section measurement-interactive"><span class="card-label">TRY IT / 01</span><h2>Measurement in action</h2><p>Measure a qubit in a 50/50 state. Repeated measurements can produce different outcomes.</p><div class="measure-demo"><div class="measure-state" id="measurement-state">|+⟩</div><span>50% |0⟩ + 50% |1⟩</span></div><button class="measure-pair-button" id="measure-qubit-button" type="button">MEASURE</button><p class="simulation-note" id="measurement-result-note">The qubit is ready to measure.</p></div>
    <div class="qubit-section"><h2>What happens during measurement?</h2><p>Measurement causes a quantum state to produce a definite outcome. If the result is 0, the qubit is found in <strong>|0⟩</strong>. If the result is 1, it is found in <strong>|1⟩</strong>.</p><div class="measure-flow"><strong>|ψ⟩</strong><span>↓</span><strong>Measurement</strong><div><i>↙</i><i>↘</i></div><div><em>|0⟩</em><em>|1⟩</em></div></div></div>
    <div class="qubit-section"><h2>Measurement is probabilistic</h2><p>Quantum mechanics predicts the probability of each possible outcome, but the individual result of a measurement is fundamentally probabilistic. The same 50/50 state can produce either result on different runs.</p></div>
    <div class="qubit-section"><h2>Measurement and superposition</h2><p>Superposition describes the possible outcomes before measurement. Measurement selects one of those outcomes and gives us classical information.</p><div class="state-flow"><span>Superposition</span><b>↓</b><strong>|ψ⟩ = α|0⟩ + β|1⟩</strong><b>↓</b><span>One classical result</span></div></div>
    <div class="qubit-section"><h2>Measurement and information</h2><p>Quantum computers eventually need to produce classical information. Measurement is the step that allows us to read the result of a quantum computation.</p></div>
    <div class="qubit-section"><h2>Why does measurement matter?</h2><p>Without measurement, we cannot directly extract the final classical result from a quantum system. It connects the quantum world with the information we can observe and use.</p></div>
    <aside class="key-idea"><span class="card-label">Key idea</span><p>A qubit can hold a quantum state with multiple possible outcomes, but measurement gives us one definite classical result.</p></aside>
  </section>`;
}

function complexNumbersLessonTemplate(topic) {
  const examples = [
    {
      title: 'A Complex Number, Shown Exactly',
      concept: 'A single complex number can be described in several equivalent ways: by its real and imaginary parts, its magnitude and argument, or its polar form.',
      code: 'from sia import hdqs\nz = hdqs.cnum(1, 1)\nprint(z, abs(z), z.arg(), z.polar())',
      output: '1 + i 1.4142135623730951 0.7853981633974483 (1.4142135623730951, 0.7853981633974483)',
      codeExplanation: 'The import makes the Sia Script mathematical interface available. hdqs.cnum(1, 1) constructs the complex number 1 + i. The print statement requests its standard form, magnitude, argument, and polar representation.',
      outputExplanation: 'The value is 1 + i. Its magnitude is √2, its argument is approximately 0.7854 radians (π/4), and the polar pair contains the same magnitude and angle. These are four descriptions of one complex number.'
    },
    {
      title: 'Everything About It at Once',
      concept: 'The explain() method gathers the properties of one complex number into a compact report.',
      code: 'from sia import hdqs\nhdqs.cnum(1, 1).explain();',
      output: 'z = 1 + i\nreal part = 1,  imaginary part = 1\nmodulus |z| = √2\nargument arg z = π/4\npolar form: z = √2·e^(πi·/4)\nconjugate z̄ = 1 − i',
      codeExplanation: 'The code constructs the same complex number and calls explain() to request a compact report of its properties.',
      outputExplanation: 'The report identifies real and imaginary parts as 1, magnitude as √2, angle as π/4, polar form as √2e^(iπ/4), and conjugate as 1 − i.'
    },
    {
      title: 'Multiplying by i Turns a Number by a Quarter Turn',
      concept: 'Both factors and the product; the angles add and the lengths multiply.',
      code: 'from sia import hdqs\n(hdqs.cnum(1, 1) * 1j).draw(dpi=80);',
      output: '<Figure size 640x600 with 1 Axes>',
      image: 'images/complex-number-multiply-by-i.png',
      imageAlt: 'Original Sia Script complex-plane output: z₁ = 1 + i is rotated by multiplication by i into z₁ · z₂ = −1 + i; z₂ = i. The arrows show the original vector, the quarter-turn factor, and the product.',
      imageCaption: 'Original Sia Script execution figure from Volume 1, page 4.',
      codeExplanation: 'The code creates 1 + i, multiplies it by the imaginary unit i, and calls draw() to display the operation geometrically.',
      outputExplanation: 'The recorded output is a figure rather than a printed number. It visualizes multiplication by i, which rotates a complex number by 90 degrees without changing its magnitude.'
    },
    {
      title: 'Addition Is Adding Arrows',
      concept: 'A complex number can be drawn as an arrow in the complex plane. Adding two complex numbers combines their real parts and their imaginary parts.',
      code: 'from sia import hdqs\n(hdqs.cnum(1, 1) + hdqs.cnum(2, -1)).draw(dpi=80);',
      output: '<Figure size 640x600 with 1 Axes>',
      image: 'images/complex-vector-addition.png',
      imageAlt: 'Original Sia Script complex-plane output: arrows for z₁ = 1 + i and z₂ = 2 − i combine to give z₁ + z₂ = 3 along the real axis.',
      imageCaption: 'Original Sia Script execution figure from Volume 1, page 5.',
      codeExplanation: 'Two complex-number objects are created and added. The draw() call displays the sum as a geometric vector in the complex plane.',
      outputExplanation: 'The figure represents (1 + i) + (2 − i) = 3. The imaginary components cancel, leaving a real result of 3.'
    },
    {
      title: 'Conjugate, Powers and De Moivre',
      concept: 'The conjugate reflects a complex number across the real axis. Taking powers multiplies its magnitude and adds its argument repeatedly.',
      code: 'from sia import hdqs\nz = hdqs.cnum(1, 1)\nprint(z.conj(), z ** 2, z ** 4, z ** 8)',
      output: '1 − i 2i −4 16',
      codeExplanation: 'The variable z stores the complex number 1 + i. The code prints its complex conjugate and its second, fourth, and eighth integer powers.',
      outputExplanation: 'The conjugate is 1 − i. The powers are (1 + i)² = 2i, (1 + i)⁴ = −4, and (1 + i)⁸ = 16. Each multiplication adds the argument and multiplies the magnitude, illustrating De Moivre’s theorem.'
    }
  ];

  return `<section class="qubit-lesson math-lesson complex-numbers-lesson">
    <section class="qubit-section complex-concept">
      <h2>Introduction</h2>
      <p>${topic.intro}</p>
      <h2>Learning Objectives</h2>
      <ul>
        <li>Write a complex number in Cartesian and polar form.</li>
        <li>Calculate its conjugate, magnitude, and argument.</li>
        <li>Explain how magnitude and relative phase affect quantum amplitudes.</li>
      </ul>
      <h2>Core Concepts</h2>
      <p>A complex number is <strong>z = a + bi</strong>, where <strong>a</strong> and <strong>b</strong> are real and <strong>i² = −1</strong>. The real and imaginary parts are coordinates in a plane, not two different kinds of number.</p>
      <h2>Mathematical Foundations</h2>
      <p>Complex arithmetic extends ordinary arithmetic so that quantum amplitudes can carry both magnitude and phase. The conjugate reverses the sign of the imaginary part, and the magnitude measures distance from the origin.</p>
      <div class="complex-equations" aria-label="Complex number definitions">
        <div class="complex-equation"><math display="block" aria-label="z equals a plus b i"><mi>z</mi><mo>=</mo><mi>a</mi><mo>+</mo><mi>b</mi><mi>i</mi></math><p><strong>z</strong> is the complex number, <strong>a</strong> is its real part, <strong>b</strong> is its real-valued imaginary coefficient, and <strong>i</strong> is the imaginary unit.</p></div>
        <div class="complex-equation"><math display="block" aria-label="i squared equals negative one"><msup><mi>i</mi><mn>2</mn></msup><mo>=</mo><mo>−</mo><mn>1</mn></math><p>Squaring the imaginary unit gives negative one.</p></div>
        <div class="complex-equation"><math display="block" aria-label="z conjugate equals a minus b i"><msup><mi>z</mi><mo>*</mo></msup><mo>=</mo><mi>a</mi><mo>−</mo><mi>b</mi><mi>i</mi></math><p><strong>z*</strong> is the complex conjugate: it keeps the real part and changes the sign of the imaginary part.</p></div>
        <div class="complex-equation"><math display="block" aria-label="magnitude of z equals square root of a squared plus b squared"><mo>|</mo><mi>z</mi><mo>|</mo><mo>=</mo><msqrt><msup><mi>a</mi><mn>2</mn></msup><mo>+</mo><msup><mi>b</mi><mn>2</mn></msup></msqrt></math><p><strong>|z|</strong> is the magnitude (modulus), the distance from the origin to the point <strong>(a, b)</strong> in the complex plane.</p></div>
        <div class="complex-equation"><math display="block" aria-label="z equals magnitude of z times e to the i theta"><mi>z</mi><mo>=</mo><mo>|</mo><mi>z</mi><mo>|</mo><msup><mi>e</mi><mrow><mi>i</mi><mi>θ</mi></mrow></msup></math><p>This is polar form: <strong>|z|</strong> is the magnitude, <strong>e</strong> is Euler’s number, <strong>i</strong> is the imaginary unit, and <strong>θ</strong> (theta) is the argument or phase angle, measured from the positive real axis.</p></div>
      </div>
      <h3>Why Complex Numbers Matter in Quantum Computing</h3>
      <p>Quantum states use complex numbers as probability amplitudes. An amplitude’s squared magnitude determines its probability; its phase carries additional information. When alternatives combine, their <strong>relative phases</strong> can make amplitudes reinforce or cancel through interference. The magnitude alone does not capture that phase effect.</p>
      <h2>Important Formulas</h2>
      <div class="qubit-equation">z₁ + z₂ = (a₁ + a₂) + i(b₁ + b₂)</div>
      <div class="qubit-equation">(a + bi)(c + di) = (ac − bd) + i(ad + bc)</div>
      <div class="qubit-equation">|z|² = z z̄ = a² + b² &nbsp;&nbsp; P = |amplitude|²</div>
      <p>Euler’s relationship <strong>e<sup>iθ</sup> = cos(θ) + i sin(θ)</strong> connects phase to a rotation in the complex plane.</p>
    </section>
    <section class="qubit-section">
      <h2>Step-by-Step Examples</h2>
      <p>For <strong>z = 1 + i</strong>, the magnitude is <strong>|z| = √(1² + 1²) = √2</strong> and the argument is <strong>θ = arctan(1/1) = π/4</strong>.</p>
      <p>Squaring gives <strong>(1 + i)² = 1 + 2i + i² = 2i</strong>. The magnitude is squared and the angle doubles: <strong>(√2)²e<sup>iπ/2</sup> = 2i</strong>.</p>
      <p>As a second calculation, <strong>(1 + i) + (2 − i) = 3</strong>; the imaginary parts cancel.</p>
    </section>
    <section class="qubit-section">
      <h2>Applications in Quantum Computing</h2>
      <p>Complex amplitudes encode quantum-state probabilities and relative phase. Quantum gates change those amplitudes; interference then uses phase differences to reinforce or cancel possible outcomes. This is why a circuit must track complex amplitudes rather than probabilities alone.</p>
    </section>
    ${examples.map((example, index) => `<section class="qubit-section complex-example">
      <h2>${example.title}</h2>
      <div class="complex-example-step"><h3>Concept</h3><p>${example.concept}</p></div>
      <div class="complex-example-step"><h3>Sia Script Code</h3><pre class="hdqs-code"><code>${example.code}</code></pre></div>
      <div class="complex-example-step"><h3>Code Output</h3><pre class="hdqs-output"><code>${example.output.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>${example.image ? `<figure class="complex-output-figure"><img src="${example.image}" alt="${example.imageAlt}"><figcaption>${example.imageCaption} This is the original recorded output, not a recreated illustration.</figcaption></figure>` : ''}</div>
      <div class="complex-example-step"><h3>Code Explanation</h3><p>${example.codeExplanation}</p></div>
      <div class="complex-example-step"><h3>Output Explanation</h3><p>${example.outputExplanation}</p></div>
    </section>`).join('')}
    <aside class="key-idea"><h2>Key Takeaways</h2><ul><li>Complex numbers have real and imaginary components.</li><li>The squared magnitude of an amplitude gives a measurement probability.</li><li>Relative phase affects interference even when probabilities initially match.</li><li>Polar form turns multiplication into magnitude multiplication and angle addition.</li></ul></aside>
  </section>`;
}

function vectorsLessonTemplate(topic) {
  const examples = [
    {
      number: 6,
      title: 'Vectors: Inner Product, Norm and Normalization',
      code: 'from sia import hdqs\nu, v = hdqs.vec([1, 1j]), hdqs.vec([1, -1j])\nprint(u.dot(v), u.dot(u), u.norm(), u.normalize())',
      output: '0 2 1.4142135623730951 vec√(1/2, i√/2)',
      codeExplanation: [
        '<code>from sia import hdqs</code> makes Sia Script’s mathematical interface available.',
        '<code>u, v = hdqs.vec([1, 1j]), hdqs.vec([1, -1j])</code> creates the two vectors u = (1, i) and v = (1, −i).',
        '<code>print(...)</code> requests the inner product u·v, the inner product u·u, the norm of u, and the normalized version of u, in that order.'
      ],
      outputExplanation: 'The inner product ⟨u|v⟩ is zero, so the vectors are orthogonal. The squared norm ⟨u|u⟩ is 2, giving ∥u∥ = √2. Dividing each component by √2 gives the unit vector (1/√2, i/√2).'
    },
    {
      number: 7,
      title: 'A Complex 2-Vector: Its Components and Its Point on the Bloch Sphere',
      code: 'from sia import hdqs\nhdqs.vec([1, 1j]).draw(dpi=70);',
      output: '<Figure size 900x380 with 3 Axes>',
      image: 'images/vectors-complex-state-components.png',
      imageAlt: 'Original Sia Script output showing the two complex vector components in the complex plane and the vector’s point on a Bloch sphere.',
      imageCaption: 'Original Sia Script execution figure from Volume 1, page 6.',
      codeExplanation: [
        '<code>from sia import hdqs</code> makes Sia Script’s mathematical interface available.',
        '<code>hdqs.vec([1, 1j])</code> creates the complex vector (1, i).',
        '<code>.draw(dpi=70)</code> asks Sia Script to draw the vector and its visual representation at the specified resolution.'
      ],
      outputExplanation: 'The notebook records a three-panel figure rather than a console value. The figure connects the vector’s complex components with their geometric representation.'
    },
    {
      number: 8,
      title: 'Projection of One Vector onto Another',
      code: 'from sia import hdqs\nhdqs.vec([3, 1]).project([1, 1]).draw(dpi=70);',
      output: '<Figure size 620x600 with 1 Axes>',
      image: 'images/vectors-projection.png',
      imageAlt: 'Original Sia Script output showing vector (3, 1) and its projection onto the direction (1, 1) in the plane.',
      imageCaption: 'Original Sia Script execution figure from Volume 1, page 7.',
      codeExplanation: [
        '<code>from sia import hdqs</code> makes Sia Script’s mathematical interface available.',
        '<code>hdqs.vec([3, 1])</code> creates the vector (3, 1).',
        '<code>.project([1, 1])</code> finds its projection onto the direction (1, 1), and <code>.draw(dpi=70)</code> displays the original vector and its projection.'
      ],
      outputExplanation: 'The figure shows the component of (3, 1) that lies along (1, 1), distinguishing the projection from the original vector.'
    }
  ];

  return `<section class="qubit-lesson math-lesson vectors-lesson">
    <section class="qubit-section vectors-concept">
      <h2>Introduction</h2>
      <p>${topic.intro}</p>
      <h2>Learning Objectives</h2>
      <ul>
        <li>Represent a state as an ordered vector of amplitudes.</li>
        <li>Calculate complex inner products, norms, and normalized vectors.</li>
        <li>Use orthogonality and normalization to interpret quantum states.</li>
      </ul>
      <h2>Core Concepts</h2>
      <p>A quantum state is represented by a vector: an ordered list of components. Inner products compare vectors and, for complex vectors, conjugate the components of the first vector. The norm measures a vector’s length. Normalizing a quantum state makes its norm one, so the probabilities associated with its components sum to one.</p>
    </section>
    <section class="qubit-section vectors-foundations">
      <h2>Mathematical Foundations</h2>
      <div class="vectors-formula"><math display="block" aria-label="ket v equals the transpose of the vector v one through v n"><mo>|</mo><mi>v</mi><mo>⟩</mo><mo>=</mo><msup><mrow><mo>(</mo><msub><mi>v</mi><mn>1</mn></msub><mo>,</mo><mo>…</mo><mo>,</mo><msub><mi>v</mi><mi>n</mi></msub><mo>)</mo></mrow><mi>T</mi></msup></math><p>A vector has components v₁ through vₙ; <strong>T</strong> denotes transpose, writing the listed components as a column vector.</p></div>
      <div class="vectors-formula"><math display="block" aria-label="norm of v equals the square root of the inner product of v with v"><mo>∥</mo><mi>v</mi><mo>∥</mo><mo>=</mo><msqrt><mo>⟨</mo><mi>v</mi><mo>|</mo><mi>v</mi><mo>⟩</mo></msqrt></math><p>The norm ∥v∥ is the vector’s length. The inner product ⟨v|v⟩ gives its squared length.</p></div>
      <div class="vectors-formula"><math display="block" aria-label="inner product u v equals the sum from i equals one to n of complex conjugate u i times v i"><mo>⟨</mo><mi>u</mi><mo>|</mo><mi>v</mi><mo>⟩</mo><mo>=</mo><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><msubsup><mi>u</mi><mi>i</mi><mo>*</mo></msubsup><msub><mi>v</mi><mi>i</mi></msub></math><p>The inner product ⟨u|v⟩ sums corresponding components. The star means complex conjugate: conjugate each component of the first vector uᵢ before multiplying it by the corresponding component vᵢ.</p></div>
      <div class="vectors-formula"><math display="block" aria-label="a normalized vector satisfies the inner product of v with v equals one"><mo>⟨</mo><mi>v</mi><mo>|</mo><mi>v</mi><mo>⟩</mo><mo>=</mo><mn>1</mn></math><p>A vector is normalized when its norm is one. Dividing a nonzero vector by its norm produces a unit vector; for a quantum state this makes the total measurement probability one.</p></div>
    </section>
    <section class="qubit-section">
      <h2>Important Formulas</h2>
      <div class="qubit-equation">⟨u|v⟩ = Σᵢ uᵢ* vᵢ &nbsp;&nbsp; ∥v∥ = √⟨v|v⟩</div>
      <div class="qubit-equation">|v̂⟩ = |v⟩ / ∥v∥ &nbsp;&nbsp; Σᵢ |αᵢ|² = 1</div>
    </section>
    <section class="qubit-section">
      <h2>Step-by-Step Examples</h2>
      <p>Let <strong>u = (1, i)</strong> and <strong>v = (1, −i)</strong>. Conjugate the first vector: <strong>u† = (1, −i)</strong>.</p>
      <p>Then <strong>⟨u|v⟩ = 1·1 + (−i)(−i) = 1 − 1 = 0</strong>, so u and v are orthogonal.</p>
      <p>Also <strong>⟨u|u⟩ = 1·1 + (−i)i = 2</strong>, hence <strong>∥u∥ = √2</strong> and the normalized vector is <strong>u/√2 = (1/√2, i/√2)</strong>.</p>
    </section>
    <section class="qubit-section">
      <h2>Applications in Quantum Computing</h2>
      <p>State vectors store quantum amplitudes; inner products give overlaps and measurement probabilities; norms verify normalization; and projections describe components selected by a measurement or basis change. Orthogonal vectors represent perfectly distinguishable outcomes.</p>
    </section>
    ${examples.map((example) => `<section class="qubit-section vectors-example">
      <h2>${example.title}</h2>
      <div class="vectors-example-step"><h3>Sia Script Code</h3><pre class="hdqs-code"><code>${example.code}</code></pre></div>
      <div class="vectors-example-step"><h3>Code Output</h3><pre class="hdqs-output"><code>${example.output.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>${example.image ? `<figure class="vectors-output-figure"><img src="${example.image}" alt="${example.imageAlt}"><figcaption>${example.imageCaption}</figcaption></figure>` : ''}</div>
      <div class="vectors-example-step"><h3>Code Explanation</h3><ol class="vectors-code-explanation">${example.codeExplanation.map((line) => `<li>${line}</li>`).join('')}</ol></div>
      <div class="vectors-example-step"><h3>Output Explanation</h3><p>${example.outputExplanation}</p></div>
    </section>`).join('')}
    <aside class="key-idea vectors-takeaway"><h2>Key Takeaways</h2><ul><li>A vector lists amplitudes in an ordered basis.</li><li>Complex inner products conjugate the first vector.</li><li>The norm measures length; normalization makes it one.</li><li>Orthogonality means zero inner product.</li><li>Born probabilities are squared amplitude magnitudes.</li></ul></aside>
  </section>`;
}

function stateVectorsLessonTemplate() {
  return `<section class="qubit-lesson math-lesson state-vectors-lesson">
    <div class="qubit-section"><h2>Quantum State Representation</h2><p>A qubit can be represented as:</p><div class="qubit-equation">|ψ⟩ = α|0⟩ + β|1⟩</div><ul><li><strong>|ψ⟩</strong> is the quantum state.</li><li><strong>|0⟩</strong> and <strong>|1⟩</strong> are basis states.</li><li><strong>α</strong> and <strong>β</strong> are probability amplitudes.</li></ul><p>The same state can be written as a vector:</p><div class="vector-equation">|ψ⟩ = <span>⌈ α ⌉<br>⌊ β ⌋</span></div></div>
    <div class="qubit-section"><h2>Basis States</h2><p>The computational basis contains the two fundamental measurement outcomes for a single qubit:</p><div class="vector-pair"><div><strong>|0⟩ =</strong><span>⌈ 1 ⌉<br>⌊ 0 ⌋</span></div><div><strong>|1⟩ =</strong><span>⌈ 0 ⌉<br>⌊ 1 ⌋</span></div></div><p>Before measurement, a qubit may be described as a combination of these basis states.</p></div>
    <div class="qubit-section"><h2>Superposition</h2><p>A qubit can exist in a combination of basis states before measurement:</p><div class="qubit-equation">|ψ⟩ = 1/√2 |0⟩ + 1/√2 |1⟩</div><p>This state contains both possible outcomes with equal probability. The detailed intuition for superposition was introduced in Quantum Fundamentals.</p></div>
    <div class="qubit-section"><h2>Probability Amplitudes</h2><p>Amplitude is not the same as probability. For:</p><div class="qubit-equation">|ψ⟩ = α|0⟩ + β|1⟩</div><div class="probability-grid"><div><strong>P(0) = |α|²</strong><span>Probability of measuring 0</span></div><div><strong>P(1) = |β|²</strong><span>Probability of measuring 1</span></div></div><div class="qubit-equation">|α|² + |β|² = 1</div><p>For a numerical example:</p><div class="qubit-equation">|ψ⟩ = √0.25|0⟩ + √0.75|1⟩</div><div class="probability-grid"><div><strong>P(0) = 0.25</strong></div><div><strong>P(1) = 0.75</strong></div></div></div>
    <div class="qubit-section"><h2>Measurement</h2><p>Measurement converts quantum possibilities into one definite classical outcome. For <strong>|ψ⟩ = √0.25|0⟩ + √0.75|1⟩</strong>, the result is 0 with 25% probability or 1 with 75% probability.</p><div class="measure-flow"><strong>|ψ⟩</strong><span>↓</span><strong>Measurement</strong><div><i>↙</i><i>↘</i></div><div><em>0</em><em>1</em></div><div><em>25%</em><em>75%</em></div></div><p>After measurement, the qubit is found in the measured basis state.</p></div>
    <div class="qubit-section"><h2>Phase and Interference</h2><p>Probability depends on the magnitude of an amplitude, while phase can affect interference.</p><div class="phase-grid"><div>|ψ₁⟩ = 1/√2 |0⟩ + 1/√2 |1⟩</div><div>|ψ₂⟩ = 1/√2 |0⟩ − 1/√2 |1⟩</div></div><p>These states have the same individual measurement probabilities in the computational basis, but their relative phase is different. That difference becomes important when quantum states interfere.</p></div>
    <div class="qubit-section"><h2>Connection to Quantum Gates</h2><p>Quantum gates transform state vectors:</p><div class="qubit-equation">U|ψ⟩ = |ψ'⟩</div><p>Applying a gate changes the amplitudes and/or phases of the state. The Quantum Gates chapter will explain these transformations in detail.</p></div>
    <aside class="key-idea vectors-takeaway"><span class="card-label">Key takeaway</span><ul><li>A state vector describes the quantum state.</li><li>Probability amplitudes describe the possible outcomes.</li><li>Squared magnitudes give measurement probabilities.</li><li>Normalization ensures total probability equals 1.</li><li>Phase becomes important when quantum states interfere.</li><li>Quantum gates transform state vectors and their amplitudes.</li></ul></aside>
  </section>`;
}

function matricesLessonTemplate() {
  return `<section class="qubit-lesson math-lesson matrices-lesson">
    <div class="qubit-section"><h2>What is a Matrix?</h2><p>A matrix is an arrangement of numbers in rows and columns. Its dimensions describe how many rows and columns it contains.</p><div class="vector-equation">A = <span>⌈ a &nbsp; b ⌉<br>⌊ c &nbsp; d ⌋</span></div><p>A 2×2 matrix can operate on a single-qubit state vector:</p><div class="vector-equation">|ψ⟩ = <span>⌈ α ⌉<br>⌊ β ⌋</span></div><p>Applying the matrix can transform this state into a new state.</p></div>
    <div class="qubit-section"><h2>Matrix–Vector Multiplication</h2><p>Applying a matrix to a quantum state is written:</p><div class="qubit-equation">A|ψ⟩ = |ψ'⟩</div><p>For:</p><div class="vector-pair"><div><strong>A =</strong><span>⌈ 1 &nbsp; 0 ⌉<br>⌊ 0 &nbsp; −1 ⌋</span></div><div><strong>|ψ⟩ =</strong><span>⌈ α ⌉<br>⌊ β ⌋</span></div></div><div class="vector-equation">A|ψ⟩ = <span>⌈ &nbsp; α &nbsp; ⌉<br>⌊ −β ⌋</span></div><p>The matrix changes the state while preserving quantum-mechanical rules when it represents a valid quantum operation.</p></div>
    <div class="qubit-section"><h2>Identity Matrix</h2><p>The identity matrix is:</p><div class="vector-equation">I = <span>⌈ 1 &nbsp; 0 ⌉<br>⌊ 0 &nbsp; 1 ⌋</span></div><div class="qubit-equation">I|ψ⟩ = |ψ⟩</div><p>It does not change the quantum state.</p></div>
    <div class="qubit-section"><h2>Quantum Operators</h2><p>A quantum operator is a mathematical object that acts on a quantum state to produce another state.</p><div class="qubit-equation">U|ψ⟩ = |ψ'⟩</div><ul><li><strong>U</strong> represents the operation.</li><li><strong>|ψ⟩</strong> is the original state.</li><li><strong>|ψ'⟩</strong> is the resulting state.</li></ul><p>Quantum gates are commonly represented using operators and matrices.</p></div>
    <div class="qubit-section"><h2>Unitary Operators</h2><p>Unitary operators are the important class of matrices used for reversible quantum evolution:</p><div class="qubit-equation">U†U = UU† = I</div><p><strong>U†</strong> is the conjugate transpose of <strong>U</strong>. Unitary operations preserve normalization and therefore preserve valid probability distributions. Quantum gates are represented by unitary matrices.</p></div>
    <div class="qubit-section"><h2>Common Quantum Matrices</h2><p>These single-qubit matrices show how quantum gates connect to matrix operations:</p><div class="matrix-list"><div><strong>Pauli-X</strong><span>X = ⌈ 0 &nbsp; 1 ⌉<br>    ⌊ 1 &nbsp; 0 ⌋</span><small>Swaps |0⟩ and |1⟩.</small></div><div><strong>Pauli-Y</strong><span>Y = ⌈ 0 &nbsp; −i ⌉<br>    ⌊ i &nbsp;&nbsp; 0 ⌋</span><small>Changes the state while introducing a phase factor.</small></div><div><strong>Pauli-Z</strong><span>Z = ⌈ 1 &nbsp;&nbsp; 0 ⌉<br>    ⌊ 0 &nbsp; −1 ⌋</span><small>Leaves |0⟩ unchanged and changes the phase of |1⟩.</small></div><div><strong>Hadamard</strong><span>H = 1/√2 ⌈ 1 &nbsp; 1 ⌉<br>            ⌊ 1 &nbsp; −1 ⌋</span><small>Creates an equal superposition from a basis state.</small></div></div><p>The Quantum Gates chapter will explore these transformations in detail.</p></div>
    <div class="qubit-section"><h2>Hermitian Operators</h2><p>Hermitian operators satisfy:</p><div class="qubit-equation">A = A†</div><p>They are important in quantum measurement because their eigenvalues are real and can represent measurable physical quantities.</p></div>
    <div class="qubit-section"><h2>Eigenvalues &amp; Eigenvectors</h2><p>An eigenvector and eigenvalue satisfy:</p><div class="qubit-equation">A|v⟩ = λ|v⟩</div><ul><li><strong>|v⟩</strong> is an eigenvector.</li><li><strong>λ</strong> is its eigenvalue.</li><li>Applying the operator changes the vector only by a scale factor.</li></ul><p>Eigenvalues and eigenvectors become important when studying quantum measurement.</p></div>
    <div class="qubit-section"><h2>From Matrices to Quantum Gates</h2><div class="state-flow math-flow"><span>Matrix</span><b>↓</b><strong>Operator</strong><b>↓</b><span>Transformation of a quantum state</span><b>↓</b><strong>Quantum Gate</strong></div><p>Quantum gates are mathematical operations represented by matrices. Applying a gate means multiplying its matrix by the quantum state vector:</p><div class="qubit-equation">|ψ'⟩ = U|ψ⟩</div></div>
    <aside class="key-idea"><span class="card-label">Key takeaway</span><p>Quantum states are represented by vectors, while quantum operations are represented by matrices. Applying a matrix transforms the state, and unitary matrices ensure that the resulting state remains physically valid.</p></aside>
  </section>`;
}

function tensorLessonTemplate() {
  return `<section class="qubit-lesson math-lesson complex-numbers-lesson tensor-lesson">
    <section class="qubit-section complex-concept">
      <h2>Concept</h2>
      <p>Tensor products combine the state spaces of separate quantum systems. They provide the mathematical structure for multi-qubit registers.</p>
    </section>
    <section class="qubit-section tensor-foundations">
      <h2>Mathematical Foundations</h2>
      <p>For two vectors <strong>|a⟩ = (a₀, a₁)<sup>T</sup></strong> and <strong>|b⟩ = (b₀, b₁)<sup>T</sup></strong>, their tensor product pairs each component of the first vector with each component of the second:</p>
      <div class="complex-equation">
        <math display="block" aria-label="ket a tensor ket b equals the transpose of a zero b zero, a zero b one, a one b zero, a one b one">
          <mo>|</mo><mi>a</mi><mo>⟩</mo><mo>⊗</mo><mo>|</mo><mi>b</mi><mo>⟩</mo><mo>=</mo>
          <msup><mrow><mo>(</mo><msub><mi>a</mi><mn>0</mn></msub><msub><mi>b</mi><mn>0</mn></msub><mo>,</mo>
          <msub><mi>a</mi><mn>0</mn></msub><msub><mi>b</mi><mn>1</mn></msub><mo>,</mo>
          <msub><mi>a</mi><mn>1</mn></msub><msub><mi>b</mi><mn>0</mn></msub><mo>,</mo>
          <msub><mi>a</mi><mn>1</mn></msub><msub><mi>b</mi><mn>1</mn></msub><mo>)</mo></mrow><mi>T</mi></msup>
        </math>
        <p><strong>⊗</strong> denotes the tensor product, and the superscript <strong>T</strong> denotes transpose. Combining two two-component vectors gives a four-component vector: the dimension multiplies, so a pair of two-level systems has four basis states.</p>
      </div>
      <p>For two qubits those basis states are <strong>|00⟩</strong>, <strong>|01⟩</strong>, <strong>|10⟩</strong> and <strong>|11⟩</strong>.</p>
    </section>
    <section class="qubit-section complex-example">
      <h2>Tensor products build multi-qubit states</h2>
      <div class="complex-example-step">
        <h3>Sia Script Code</h3>
        <pre class="hdqs-code"><code>from sia import hdqs
print(hdqs.vec([1, 0]).kron([0, 1]), hdqs.vec([1, 1]).kron([1, -1]).normalize())
hdqs.vec([1, 1]).kron([1, -1]).normalize().explain();</code></pre>
      </div>
      <div class="complex-example-step">
        <h3>Actual Output</h3>
        <pre class="hdqs-output"><code>vec(0, 1, 0, 0) vec(1/2, −1/2, 1/2, −1/2)
v = (1/2, −1/2, 1/2, −1/2)
norm ‖‖v = 1‖‖
v = 1 →unit vector
v‖/‖v = (1/2)⟩|00 −(1/2)⟩|01 + (1/2)⟩|10 −(1/2)⟩|11</code></pre>
      </div>
      <div class="complex-example-step">
        <h3>Code Explanation</h3>
        <ol class="vectors-code-explanation">
          <li><code>from sia import hdqs</code> imports the Sia Script math tools used in the example.</li>
          <li>The first <code>hdqs.vec(...).kron(...)</code> forms the tensor product of the basis vectors (1, 0) and (0, 1). The next tensor product combines (1, 1) and (1, −1), then <code>.normalize()</code> scales the resulting four-component vector to have norm 1.</li>
          <li>The final <code>.explain()</code> call requests a report about that normalized vector.</li>
        </ol>
      </div>
      <div class="complex-example-step">
        <h3>Output Explanation</h3>
        <p>The first tensor product is (0, 1, 0, 0), corresponding to the basis state <strong>|01⟩</strong>. The second vector has four amplitudes of magnitude 1/2 with alternating signs. Its norm is 1, so it is normalized and represents a valid two-qubit state.</p>
      </div>
    </section>
  </section>`;
}

function futureMathLessonTemplate(topic) {
  return `<section class="qubit-lesson math-lesson"><div class="qubit-section"><h2>${topic.title}</h2><p>${topic.intro}</p><p>This Mathematical Foundations topic will build on the state-vector and probability ideas introduced here.</p></div></section>`;
}

const documentedMathLessons = {
  'tensor-products': {
    concept: 'Tensor products combine the state spaces of separate quantum systems. They provide the mathematical structure for multi-qubit registers.',
    foundation: '<p>For two vectors |a⟩ = (a₀, a₁)<sup>T</sup> and |b⟩ = (b₀, b₁)<sup>T</sup>, their tensor product pairs each component of the first vector with each component of the second:</p><div class="qubit-equation">|a⟩ ⊗ |b⟩ = (a₀b₀, a₀b₁, a₁b₀, a₁b₁)<sup>T</sup></div><p><strong>⊗</strong> denotes the tensor product and <strong>T</strong> denotes transpose. The dimension multiplies: two two-level systems have four basis states.</p>',
    examples: [{
      number: 9, title: 'Tensor products build multi-qubit states',
      code: `from sia import hdqs
print(hdqs.vec([1, 0]).kron([0, 1]), hdqs.vec([1, 1]).kron([1, -1]).normalize())
hdqs.vec([1, 1]).kron([1, -1]).normalize().explain();`,
      output: `vec(0, 1, 0, 0) vec(1/2, −1/2, 1/2, −1/2)
v = (1/2, −1/2, 1/2, −1/2)
norm ‖‖v = 1‖‖
v = 1 →unit vector
v‖/‖v = (1/2)⟩|00 −(1/2)⟩|01 + (1/2)⟩|10 −(1/2)⟩|11`,
      codeExplanation: 'The first expression forms the tensor product of the basis vectors (1, 0) and (0, 1). The second forms the tensor product of (1, 1) and (1, −1), then normalizes the resulting four-component vector. The final call requests a report about that normalized vector.',
      outputExplanation: 'The first tensor product is (0, 1, 0, 0), corresponding to |01⟩. The second vector has four amplitudes of magnitude 1/2 with alternating signs. Its norm is 1, so it is normalized and represents a valid two-qubit state.'
    }]
  },
  'matrices-matrix-operations': {
    concept: 'Matrices represent linear transformations and quantum operators. Their action changes state vectors, while determinant, trace, inverse, and conjugate transpose reveal useful properties.',
    foundation: '<p>The determinant describes area scaling for a two-dimensional transformation; the trace is the sum of diagonal entries; an inverse reverses a transformation when it exists. The dagger <strong>A†</strong> is the transpose of the complex-conjugated matrix.</p>',
    examples: [{
      number: 10, title: 'A matrix as a transformation of the plane',
      concept: 'The grid, unit circle and unit square show how a matrix acts; dashed lines indicate eigen-directions, and det A gives the area of the transformed square.',
      code: `from sia import hdqs
hdqs.mat([[2, 1], [1, 2]]).draw(dpi=80);`,
      output: '<Figure size 660x620 with 1 Axes>',
      image: 'images/matrices-transformation.png',
      imageAlt: 'Original Sia Script matrix transformation figure from Volume 1.',
      imageCaption: 'Original recorded output figure from Volume 1, page 6.',
      codeExplanation: 'The matrix [[2, 1], [1, 2]] is created and drawn as a linear transformation of the plane.',
      outputExplanation: 'The figure shows the transformed coordinate grid, unit circle and unit square. The determinant is 3, so areas scale by a factor of 3; the eigen-directions remain unchanged apart from scaling.'
    }, {
      number: 11, title: 'Determinant, inverse, trace, dagger',
      code: `from sia import hdqs
A = hdqs.mat([[1, 2], [3, 4]])
print(A.det(), A.inv(), A.trace(), hdqs.mat([[1, 1j], [2, 3]]).dag())`,
      output: `−2 mat−([2, 1; 3/2, −1/2]) 5 mat([1, 2; −i, 3])`,
      codeExplanation: 'The matrix A is created, then the code requests its determinant, inverse and trace. A second complex-valued matrix is created and its conjugate transpose (dagger) is computed.',
      outputExplanation: 'The determinant is −2, so A is invertible. The displayed inverse reverses the transformation, and the trace is 5. The dagger transposes the second matrix and complex-conjugates its entries.'
    }]
  },
  'eigenvalues-eigenvectors': {
    concept: 'An eigenvector keeps its direction under an operator; the eigenvalue tells how it is scaled. For quantum observables, eigenvalues correspond to possible measurement results.',
    foundation: '<p>The defining relation is:</p><div class="qubit-equation">A|v⟩ = λ|v⟩</div><p><strong>|v⟩</strong> is an eigenvector and <strong>λ</strong> is its eigenvalue.</p>',
    examples: [{
      number: 12, title: 'Eigenvalues and eigenvectors',
      code: `from sia import hdqs
for lam, v in hdqs.mat([[0, -1j], [1j, 0]]).eig():
    print(lam, v)`,
      output: `−1 vec(1/√2, −i/√2)
1 vec(1/√2, i/√2)`,
      codeExplanation: 'The matrix is constructed and its eigensystem is iterated over. For each eigenpair, the code prints the eigenvalue λ and a corresponding eigenvector v.',
      outputExplanation: 'The eigenvalues are −1 and +1. Each printed vector satisfies Av = λv for its corresponding eigenvalue. The vectors are normalized.'
    }]
  },
  'hermitian-unitary-matrices': {
    concept: 'Hermitian matrices represent observables, while unitary matrices represent valid reversible quantum transformations.',
    foundation: '<p>A matrix is Hermitian when <strong>A† = A</strong>. A matrix is unitary when <strong>U†U = I</strong>. The commutator <strong>[A, B] = AB − BA</strong> indicates whether two operations commute; [X, Y] = 2iZ.</p>',
    examples: [{
      number: 13, title: 'Hermitian, unitary and commutator properties',
      code: `from sia import hdqs
X, Y = hdqs.mat([[0, 1], [1, 0]]), hdqs.mat([[0, -1j], [1j, 0]])
print(X.is_hermitian(), X.is_unitary(), X.commutator(Y))
Y.draw(dpi=70);`,
      output: `True True mat([2i, 0; 0, −2i])
<Figure size 650x320 with 2 Axes>`,
      image: 'images/hermitian-unitary-matrices.png',
      imageAlt: 'Original Sia Script Pauli-Y matrix visualization from Volume 1.',
      imageCaption: 'Original recorded output figure from Volume 1, page 8.',
      codeExplanation: 'The Pauli-X and Pauli-Y matrices are created. The code checks whether X is Hermitian and unitary, computes the commutator XY − YX, and draws Y.',
      outputExplanation: 'Both checks return True: X is Hermitian and unitary. The commutator is the diagonal matrix with entries 2i and −2i, equal to 2iZ. The figure visualizes the Pauli-Y transformation.'
    }]
  },
  'matrix-vector-multiplication': {
    concept: 'A quantum gate acts on a state by matrix multiplication. This is the basic mathematical operation behind applying gates to qubits.',
    foundation: '<p>If the input state is <strong>|ψ⟩</strong>, a transformation <strong>U</strong> produces <strong>|ψ′⟩ = U|ψ⟩</strong>. For the Hadamard matrix, <strong>H|0⟩ = (|0⟩ + |1⟩)/√2</strong> and <strong>H² = I</strong>.</p>',
    examples: [{
      number: 14, title: 'Matrices act on vectors',
      code: `from sia import hdqs
H = hdqs.mat([[1, 1], [1, -1]]) * (1 / 2 ** 0.5)
print(H @ hdqs.vec([1, 0]), H @ H)`,
      output: 'vec(1/√2, 1/√2) mat([1, 0; 0, 1])',
      codeExplanation: 'The normalized Hadamard matrix is constructed. The matrix-vector product applies it to |0⟩ = (1, 0)ᵀ, and the second expression multiplies the Hadamard matrix by itself.',
      outputExplanation: 'The first result is (1/√2, 1/√2)ᵀ, corresponding to the equal superposition state |+⟩. The second result is the identity matrix, confirming H² = I.'
    }]
  },
  'dirac-notation': {
    concept: 'Dirac notation gives a compact language for quantum states and their dual vectors. A ket |ψ⟩ is a column vector; its bra ⟨ψ| is the conjugate transpose. The inner product ⟨ϕ|ψ⟩ measures overlap: zero means orthogonal states, while a normalized state has inner product one with itself.',
    foundation: '<div class="qubit-equation">⟨ϕ|ψ⟩ = 0 &nbsp; (orthogonal states) &nbsp;&nbsp; ⟨ψ|ψ⟩ = 1 &nbsp; (normalized state)</div>',
    examples: [{
      number: 23, title: 'Kets and bras by name',
      code: `from sia import hdqs
plus, minus = hdqs.ket("+"), hdqs.ket("-")
print(plus, minus.dag())
print("<+|− =", plus.dag() @ minus, "    <+|+ =", plus.dag() @ plus)`,
      output: `ket((1/√2)|0⟩ + (1/√2)|1⟩) bra((1/√2)⟨0| − (1/√2)⟨1|)
<+|− = 0    <+|+ = 1`,
      codeExplanation: 'The code creates the normalized one-qubit kets |+⟩ and |−⟩. It prints |+⟩, the conjugate transpose (bra) of |−⟩, then evaluates ⟨+|−⟩ and ⟨+|+⟩.',
      outputExplanation: 'The first inner product is zero, showing that |+⟩ and |−⟩ are orthogonal. The second is one, confirming that |+⟩ is normalized.'
    }, {
      number: 25, title: 'Outer products are matrices',
      concept: 'An outer product combines a ket and a bra to produce a matrix.',
      code: `from sia import hdqs
print(hdqs.ket("0") @ hdqs.bra("1"))
print(hdqs.ket("+") @ hdqs.bra("+"))`,
      output: `mat([0, 1; 0, 0])
mat([1/2, 1/2; 1/2, 1/2])`,
      codeExplanation: 'The first expression multiplies ket |0⟩ by bra ⟨1| to form an outer-product matrix. The second forms the projector |+⟩⟨+|.',
      outputExplanation: 'The first matrix maps the |1⟩ component into the |0⟩ direction. The second is a projector onto the plus state; it is Hermitian and leaves that state unchanged.'
    }]
  },
  'quantum-states-observables': {
    concept: 'Quantum states can be written as kets, including multi-qubit and named entangled states. Applying gates to a register changes its state; the resulting ket can be printed in ordinary or LaTeX notation.',
    foundation: '<p>A ket stores the state amplitudes in the computational basis. For a two-qubit Bell state, the two nonzero amplitudes are equal:</p><div class="qubit-equation">|ϕ⁺⟩ = (|00⟩ + |11⟩)/√2</div>',
    examples: [{
      number: 24, title: 'Two-qubit and named entangled kets',
      code: `from sia import hdqs
print(hdqs.ket("01+"))
print(hdqs.ket("phi+"), hdqs.ket("ghz", 3), sep="\\n")`,
      output: `ket((1/√2)|010⟩ + (1/√2)|011⟩)
ket((1/√2)|00⟩ + (1/√2)|11⟩)
ket((1/√2)|000⟩ + (1/√2)|111⟩)`,
      codeExplanation: 'The first call constructs a named three-qubit ket. The next requests the Bell state phi+ and a three-qubit GHZ state, printing each on a separate line.',
      outputExplanation: 'The first state has equal amplitudes on |010⟩ and |011⟩. The Bell state has equal amplitudes on |00⟩ and |11⟩; the GHZ state similarly links |000⟩ and |111⟩.'
    }, {
      number: 26, title: 'A register in Dirac notation',
      code: `from sia import hdqs
q = hdqs(2).h(0).cx(0, 1)
print(q.ket())
print(q.ket(latex=True))`,
      output: `√(1/2)|00⟩ + √(1/2)|11⟩
(1/\\sqrt{2})\\ket{00} + (1/\\sqrt{2})\\ket{11}`,
      codeExplanation: 'A two-qubit register is initialized in |00⟩. A Hadamard gate is applied to qubit 0, followed by a controlled-X gate from qubit 0 to qubit 1. The resulting state is printed in standard and LaTeX notation.',
      outputExplanation: 'Both lines represent the Bell state (|00⟩ + |11⟩)/√2. Its two basis-state amplitudes are equal, so computational-basis measurements produce either 00 or 11 with equal probability.'
    }]
  },
  'expectation-measurement': {
    concept: 'An observable is represented by a Hermitian operator. Its expectation value is the average result over repeated measurements, while variance describes the spread of possible results.',
    foundation: '<p>For an observable A in state |ψ⟩:</p><div class="qubit-equation">⟨A⟩ = ⟨ψ|A|ψ⟩ &nbsp;&nbsp; (ΔA)² = ⟨A²⟩ − ⟨A⟩²</div><p>In |+⟩, Z averages to 0 with the largest spread; in |0⟩ there is no spread.</p>',
    examples: [{
      number: 27, title: 'Expectation value, variance and uncertainty',
      code: `from sia import hdqs
Z = hdqs.pauli("Z")
print(Z.expect("+"), Z.variance("+"), Z.uncertainty("0"))`,
      output: '0.0 1.0 0.0',
      codeExplanation: 'The Pauli-Z observable is created. The code evaluates its expectation value and variance in |+⟩ and its uncertainty in |0⟩.',
      outputExplanation: 'In |+⟩, the two Z outcomes are equally likely, so the expectation is 0 and the variance is 1. In |0⟩, the Z outcome is certain, so the uncertainty is 0.'
    }, {
      number: 28, title: 'Measuring an observable: outcomes, probabilities and states after',
      code: `from sia import hdqs
hdqs.spin("x").measure("0").explain().draw();`,
      output: `|ψ⟩ = |0⟩
eigenvalue −1: P = |⟨−|ψ⟩|² = 1/2 → |ψ after⟩ = √(1/2)|0⟩ − √(1/2)|1⟩
eigenvalue 1: P = |⟨+|ψ⟩|² = 1/2 → |ψ after⟩ = √(1/2)|0⟩ + √(1/2)|1⟩
A = Σ λ·P(λ) = 0
<Figure size 490x380 with 1 Axes>`,
      image: 'images/expectation-measurement-observable.png',
      imageAlt: 'Sia Script measurement plot showing equal probabilities for observable eigenvalues negative one and positive one.',
      imageCaption: 'The two possible measurement values each occur with probability 1/2 in the prepared state.',
      codeExplanation: 'The code creates an x-spin observable, measures it on the input state |0⟩, requests a textual explanation, and draws the measurement summary.',
      outputExplanation: 'The two eigenvalues, −1 and +1, each occur with probability 1/2. The output also shows the corresponding post-measurement states and an expectation value of zero.'
    }, {
      number: 29, title: 'A joint observable on a Bell state',
      concept: 'The joint observable ZZ is +1 with certainty: the two qubits always agree.',
      code: `from sia import hdqs
print(hdqs.pauli("ZZ").measure("phi+"))`,
      output: 'measurement(P(−1) = 0, P(1) = 1)',
      codeExplanation: 'The joint Pauli-ZZ observable is measured on the Bell state |ϕ⁺⟩. The measurement object reports probabilities for its possible eigenvalues.',
      outputExplanation: 'The eigenvalue +1 occurs with probability 1 and −1 with probability 0. This confirms that the two qubits in |ϕ⁺⟩ always have matching computational-basis values.'
    }]
  },
  'quantum-dynamics-uncertainty': {
    concept: 'A quantum state changes under a Hamiltonian. Matrix exponentials describe continuous-time evolution, and uncertainty relations constrain the spreads of incompatible observables.',
    foundation: '<p>For a time-independent Hamiltonian H, the evolution operator is:</p><div class="qubit-equation">U(t) = e<sup>−iHt/ℏ</sup> &nbsp;&nbsp; |ψ(t)⟩ = U(t)|ψ(0)⟩</div><p>This notebook section uses ℏ = 1.</p>',
    examples: [{
      number: 30, title: 'Time evolution: a Rabi oscillation',
      concept: 'The Hamiltonian H = X drives the initial state |0⟩ toward |1⟩ and back; the Bloch vector traces a great circle.',
      code: `from sia import hdqs
times = hdqs.np.linspace(0, 3.1416, 60)
hdqs.evolve("X", "0", times=times).draw();`,
      output: '<Figure size 1050x420 with 2 Axes>',
      image: 'images/quantum-dynamics-rabi.png',
      imageAlt: 'Original Sia Script Rabi-oscillation figure showing state probabilities over time and the Bloch-sphere path.',
      imageCaption: 'Original recorded output figure from Volume 1, page 18.',
      codeExplanation: 'A time array is created from 0 to approximately π with 60 sample points. The evolution helper evolves the initial state |0⟩ under Hamiltonian X at those times and draws the trajectory.',
      outputExplanation: 'The state evolves under the Pauli-X Hamiltonian. The Bloch vector traces a great-circle path, taking |0⟩ toward |1⟩ and then back as time increases.'
    }, {
      number: 31, title: 'The matrix exponential',
      concept: 'e^(−iXπ/2) = −iX: a NOT gate up to a global phase.',
      code: `from sia import hdqs
print(hdqs.pauli("X").exp(3.14159265 / 2))`,
      output: 'mat([0, −i; −i, 0])',
      codeExplanation: 'The Pauli-X matrix is created and its matrix exponential is evaluated at approximately π/2.',
      outputExplanation: 'The result is −iX. This differs from the bit-flip matrix only by a global phase, which does not change measurement probabilities.'
    }, {
      number: 32, title: 'The uncertainty relation, checked',
      code: `from sia import hdqs
hdqs.uncertainty("X", "Y", "0");`,
      output: 'ΔA = 1, ΔB = 1, ΔA·ΔB = 1 ≥ ½|⟨[A, B]⟩| = 1 ✓',
      codeExplanation: 'The uncertainty helper evaluates observables X and Y in the input state |0⟩. It computes both standard deviations and the lower bound supplied by their commutator.',
      outputExplanation: 'Both uncertainties are 1, so their product is 1. The commutator-based lower bound is also 1, showing the uncertainty relation at equality for this state and these observables.'
    }]
  },
  'sequential-measurement': {
    concept: 'A measurement changes the state and can affect later measurement results. Post-selection keeps only runs matching a chosen sequence of outcomes. Measuring along one axis and then another changes the state available to the final analyser.',
    foundation: '<p>In the documented Stern–Gerlach sequence, the analysers act in order: <strong>z → x → z</strong>. The intermediate x analyser changes the state prepared by the first z analyser, so the final z analyser again splits the beam.</p>',
    examples: [{
      number: 33, title: 'Stern–Gerlach: z, then x, then z again',
      code: `from sia import hdqs
hdqs.stern_gerlach(["z", "x", "z"]).explain().draw();`,
      output: `spin in: |0⟩; analysers: z → x → z
+z → −x → −z: 1/4
+z → −x → +z: 1/4
+z → +x → −z: 1/4
+z → +x → +z: 1/4
<Figure size 980x340 with 1 Axes>`,
      image: 'images/sequential-measurement-stern-gerlach.png',
      imageAlt: 'Original Sia Script Stern–Gerlach figure showing measurement branches through z, x, and z analysers.',
      imageCaption: 'Original recorded output figure from Volume 1, page 20.',
      codeExplanation: 'The Stern–Gerlach helper is given the analyser sequence z → x → z. It explains and draws the possible measurement paths for a particle entering in the |0⟩ state.',
      outputExplanation: 'Each of the four listed paths has probability 1/4. The first z analyser prepares a definite z result; the intermediate x analyser changes the state, so the final z analyser again has two equally likely outcomes.'
    }, {
      number: 34, title: 'Keeping only one beam at each analyser',
      code: `from sia import hdqs
print(hdqs.stern_gerlach(["z", "x", "z"], keep=["+", "+", None]))`,
      output: 'stern_gerlach(+z, +x, −z: 1/4; +z, +x, +z: 1/4)',
      codeExplanation: 'The same z → x → z analyser sequence is used. The keep argument retains only the positive beam at the first two analysers and leaves the final analyser unrestricted.',
      outputExplanation: 'Only paths that pass the first two selected beams remain. The final analyser can still produce either +z or −z; each retained path is shown with probability 1/4 in the original distribution.'
    }]
  },
  'mathematical-explorers': {
    concept: 'The explorers provide visual and interactive ways to investigate the same mathematical ideas. They complement equations and notebook outputs rather than replacing the underlying theory. Generated HTML pages are learning resources that can be opened locally in a browser.',
    foundation: '<p>The documented explorers cover phasors, complex numbers, matrix transformations, double-slit behaviour, Bloch-sphere superposition, entanglement, Hilbert space, wave packets, Fourier transforms, Rabi dynamics and Stern–Gerlach measurement.</p>',
    examples: [
      { number: 36, title: 'List the available mathematical explorers', code: `from sia import hdqs
hdqs.explore();`, output: `phasor       Phasors: rotation makes waves
complex      Complex numbers in the plane
matrix       Matrices move the plane
double_slit  Double slit: waves, particles and which path
bloch        Superposition on the Bloch sphere
entanglement Entanglement: two qubits, one state
hilbert      Hilbert space: gates acting on the state
wavepacket   Wave packets: tunnelling, boxes and oscillators
fourier      The quantum Fourier transform as phasor sums
rabi         Spin in a field: Larmor, Rabi and Ramsey
stern_gerlach Stern–Gerlach: one particle at a time`, codeExplanation: 'The call with no topic argument lists the mathematical and quantum explorers available in the Sia interface.', outputExplanation: 'The list includes the named explorer topics; each can be generated individually using the following documented examples.' },
      { number: 37, title: 'Phasors: rotation makes waves', concept: 'Writes phasor.html. Turning the 3D helix shows the circle end-on, the sine from the side, and the cosine from above.', code: `from sia import hdqs
hdqs.explore("phasor")`, output: "'phasor.html'", codeExplanation: 'The explore() call selects the phasor explorer and writes its interactive page using the default filename.', outputExplanation: 'The returned filename confirms the generated page and its relation between circular rotation and sine/cosine projections.' },
      { number: 38, title: 'The complex plane and matrices', code: `from sia import hdqs
hdqs.cnum(1, 1).explore("complex.html")
hdqs.mat([[1, 1], [0, 1]]).explore("shear.html")`, output: "'shear.html'", codeExplanation: 'The first call opens the complex-number explorer and saves it as complex.html. The second opens a matrix explorer for the supplied shear matrix and saves it as shear.html.', outputExplanation: 'The returned value is the final filename, shear.html. Both pages are generated; the last expression determines the displayed return value.' },
      { number: 39, title: 'Double slit with a which-path detector', code: `from sia import hdqs
hdqs.explore("double_slit")`, output: "'double_slit.html'", codeExplanation: 'The call selects the double-slit explorer with a which-path detector.', outputExplanation: 'The returned filename confirms the generated page. The interactive page demonstrates how path information changes the interference pattern.' },
      { number: 40, title: 'Superposition and entanglement from your own registers', code: `from sia import hdqs
print(hdqs(1).ry(0, 1.0).explore("my_qubit.html"))
print(hdqs(2).h(0).cx(0, 1).explore("my_bell.html"))`, output: `my_qubit.html
my_bell.html`, codeExplanation: 'The first register prepares a one-qubit state using an Ry rotation and exports an explorer. The second prepares a two-qubit Bell register with Hadamard and controlled-X, then exports another explorer.', outputExplanation: 'The two filenames confirm creation of the individual-qubit and Bell-state pages.' },
      { number: 41, title: 'A Fourier series drawn by phasors', concept: 'Phasors turning at 1, 3, 5… × ω, added head to tail, build a square wave; the ripple at the jump (Gibbs) never goes away.', code: `from sia import hdqs
hdqs.explore("phasor", "square_wave.html", state="square")`, output: "'square_wave.html'", codeExplanation: 'The explorer is configured for a square-wave state and saved under the filename square_wave.html.', outputExplanation: 'The filename confirms the generated page. Odd harmonics build a square wave and illustrate the Gibbs ripple near discontinuities.' },
      { number: 42, title: 'Hilbert space: gates acting on the state vector and density matrix', concept: 'Up to 4 qubits. Tapping a circuit column shows that gate as a 2ⁿ×2ⁿ matrix multiplying |ψ⟩; the state table and ρ change with it.', code: `from sia import hdqs
hdqs(3).h(0).cx(0, 1).cx(1, 2).explore("ghz_hilbert.html")`, output: "'ghz_hilbert.html'", codeExplanation: 'A three-qubit register is prepared with Hadamard and two controlled-X operations, creating a GHZ-type state. The explorer exports its Hilbert-space view.', outputExplanation: 'The returned filename confirms creation of the page, which connects a circuit, state vector and density matrix.' },
      { number: 43, title: 'Wave packets, tunnelling and the box', concept: 'The explorer presents a one-dimensional Schrödinger equation with free, barrier (tunnelling), step, box or oscillator cases.', code: `from sia import hdqs
hdqs.explore("wavepacket")`, output: "'wavepacket.html'", codeExplanation: 'The call selects the wave-packet explorer.', outputExplanation: 'The returned filename confirms creation of the interactive wave-packet page.' },
      { number: 44, title: 'Spin in a field, the QFT, Stern–Gerlach', code: `from sia import hdqs
for t in ("rabi", "fourier", "stern_gerlach"):
    print(hdqs.explore(t))`, output: `rabi.html
fourier.html
stern_gerlach.html`, codeExplanation: 'A loop requests the Rabi dynamics, Fourier and Stern–Gerlach explorer pages and prints each returned filename.', outputExplanation: 'The three filenames confirm that the requested explorer pages were generated.' },
      { number: 45, title: 'In Telugu and Hindi: titles, guidance and every control', code: `from sia import hdqs
hdqs.explore("entanglement", "entanglement_te.html", lang="te")
hdqs.explore("hilbert", "hilbert_hi.html", lang="hi")`, output: "'hilbert_hi.html'", codeExplanation: 'The first call creates a Telugu-localized entanglement explorer. The second creates a Hindi-localized Hilbert-space explorer.', outputExplanation: 'The final returned filename is hilbert_hi.html. The calls request localized learning interfaces while keeping the underlying concepts unchanged.' }
    ]
  }
};

const mathLessonGuides = {
  'tensor-products': {
    core: '<p>For product states, each pair of subsystem amplitudes multiplies. A general joint state need not factor into a product; such non-factorable states include entangled states. The order of the tensor factors fixes the basis ordering.</p>',
    objectives: ['Form tensor products of state vectors in a stated basis order.', 'Determine the dimension and basis states of a combined register.', 'Distinguish product states from entangled states and identify how local gates act.'],
    formulas: '<ul><li><strong>(a₀,a₁)ᵀ ⊗ (b₀,b₁)ᵀ = (a₀b₀,a₀b₁,a₁b₀,a₁b₁)ᵀ</strong>.</li><li><strong>dim(ℋ<sub>A</sub> ⊗ ℋ<sub>B</sub>) = dim(ℋ<sub>A</sub>) dim(ℋ<sub>B</sub>)</strong>.</li><li><strong>(A ⊗ B)(|a⟩ ⊗ |b⟩) = A|a⟩ ⊗ B|b⟩</strong> for separate subsystem operations.</li></ul>',
    workedExample: '<ol><li>Write <strong>|0⟩ = (1,0)ᵀ</strong> and <strong>|1⟩ = (0,1)ᵀ</strong>.</li><li>Form their tensor product in the stated basis order: <strong>|0⟩ ⊗ |1⟩ = (1·0, 1·1, 0·0, 0·1)ᵀ = (0,1,0,0)ᵀ = |01⟩</strong>.</li><li>For <strong>|+⟩ ⊗ |−⟩</strong>, the four components are <strong>(1,−1,1,−1)/2</strong>; its squared norm is <strong>4·(1/2)² = 1</strong>.</li></ol>',
    applications: '<p>Tensor products represent registers containing multiple qubits, lift single-qubit gates into joint systems, and provide a basis for describing entanglement. For example, a two-qubit register has four computational-basis amplitudes even when prepared by separate one-qubit operations.</p>',
    takeaways: ['Tensor products combine subsystem state spaces.', 'Dimensions multiply and basis order matters.', 'Product states factor; entangled states generally do not.', 'Local gates act on their subsystem factors.']
  },
  'matrices-matrix-operations': {
    core: '<p>A matrix is a rectangular array defining a linear map once its input and output bases are fixed. Addition is entrywise; multiplication composes maps, so order matters. Only square matrices have a determinant, trace, and ordinary inverse.</p>',
    objectives: ['Perform matrix addition and multiplication and explain why order matters.', 'Calculate the determinant, trace, inverse, and conjugate transpose of a small matrix.', 'Relate matrix operations to quantum gates and state transformations.'],
    formulas: '<ul><li><strong>(AB)<sub>ij</sub> = Σ<sub>k</sub> A<sub>ik</sub>B<sub>kj</sub></strong> is matrix multiplication.</li><li><strong>tr(A) = Σᵢ A<sub>ii</sub></strong> is the trace.</li><li><strong>A⁻¹A = I</strong> when the inverse exists; for a square matrix this requires <strong>det(A) ≠ 0</strong>.</li><li><strong>A† = (A*)ᵀ</strong> is the conjugate transpose.</li></ul>',
    workedExample: '<ol><li>For <strong>A = [[1,2],[3,4]]</strong>, <strong>det(A) = 1·4 − 2·3 = −2</strong>, so A is invertible.</li><li><strong>A⁻¹ = (1/−2)[[4,−2],[−3,1]] = [[−2,1],[3/2,−1/2]]</strong>.</li><li>The trace is <strong>tr(A) = 1 + 4 = 5</strong>. Multiplying A⁻¹A returns I.</li></ol>',
    applications: '<p>Quantum gates are matrices in a chosen basis, and applying gates composes matrix transformations. Determinants, traces, and daggers help characterize operators; in quantum computing, unitarity is the key validity condition for reversible gate evolution.</p>',
    takeaways: ['Matrix multiplication composes linear transformations.', 'Multiplication order generally changes the result.', 'A nonzero determinant means a square matrix is invertible.', 'The dagger transposes and complex-conjugates entries.']
  },
  'eigenvalues-eigenvectors': {
    core: '<p>An eigenvector is a direction preserved by a linear operator, though its magnitude or phase may change. For a Hermitian observable, eigenvalues are real and label possible measurement results; an eigenstate produces its eigenvalue with certainty.</p>',
    objectives: ['Solve a characteristic equation to find eigenvalues.', 'Check an eigenvector using A|v⟩ = λ|v⟩.', 'Connect observable eigenvalues and eigenspaces to possible measurement outcomes.'],
    formulas: '<ul><li><strong>A|v⟩ = λ|v⟩</strong> defines an eigenpair.</li><li><strong>det(A − λI) = 0</strong> gives candidate eigenvalues.</li><li><strong>P(λ) = ⟨ψ|Π<sub>λ</sub>|ψ⟩</strong> gives the probability of an observable’s eigenvalue, where Π<sub>λ</sub> projects onto its eigenspace.</li></ul>',
    workedExample: '<ol><li>For the Pauli-Y matrix <strong>Y = [[0,−i],[i,0]]</strong>, <strong>det(Y − λI) = λ² − 1</strong>.</li><li>Setting this to zero gives <strong>λ = ±1</strong>.</li><li>Normalized eigenvectors are <strong>|y<sub>+</sub>⟩ = (1,i)ᵀ/√2</strong> and <strong>|y<sub>−</sub>⟩ = (1,−i)ᵀ/√2</strong>; applying Y returns the same vector times its eigenvalue.</li></ol>',
    applications: '<p>Eigenvectors identify states unchanged in direction by an operation. In measurement, an observable’s eigenspaces determine the possible outcomes and the state subspaces selected by each outcome. Eigenanalysis also helps study Hamiltonians and quantum dynamics.</p>',
    takeaways: ['Eigenvectors satisfy A|v⟩ = λ|v⟩.', 'Solve det(A − λI) = 0 to find eigenvalues.', 'Hermitian observables have real eigenvalues.', 'An eigenstate gives its associated measurement value with certainty.']
  },
  'hermitian-unitary-matrices': {
    core: '<p>Hermitian operators are equal to their own conjugate transpose and model observables. Unitary operators have an inverse equal to their dagger and preserve inner products, norms, and total probability. These are related but distinct properties.</p>',
    objectives: ['Test whether a matrix is Hermitian or unitary using its dagger.', 'Explain why Hermitian operators represent observables and unitary operators represent reversible gates.', 'Use a commutator to determine whether two operators commute.'],
    formulas: '<ul><li><strong>A† = A</strong> means A is Hermitian.</li><li><strong>U†U = UU† = I</strong> means U is unitary.</li><li><strong>[A,B] = AB − BA</strong> is the commutator; zero means the operators commute.</li><li>For Pauli matrices, <strong>[X,Y] = 2iZ</strong>.</li></ul>',
    workedExample: '<ol><li>Pauli-X is real and symmetric, so <strong>X† = X</strong>.</li><li>Since <strong>X² = I</strong>, it follows that <strong>X†X = I</strong>; X is also unitary.</li><li>For X and Y, <strong>XY = iZ</strong> and <strong>YX = −iZ</strong>, hence <strong>[X,Y] = 2iZ</strong>.</li></ol>',
    applications: '<p>Hermitian operators define measurable quantities with real outcomes. Unitary matrices represent ideal gates and closed-system evolution because they preserve state normalization and inner products. Commutators help determine whether two observables share a common eigenbasis.</p>',
    takeaways: ['Hermitian and unitary are different tests.', 'Hermitian observables have real measurement values.', 'Unitary operations preserve norms and probabilities.', 'A nonzero commutator signals order-dependent operations.']
  },
  'matrix-vector-multiplication': {
    core: '<p>A matrix acts on a column vector by taking a dot product between each matrix row and the input vector. Each output amplitude is therefore a weighted sum of input amplitudes. A valid quantum gate is a unitary matrix, which preserves the state norm.</p>',
    objectives: ['Compute a matrix-vector product one row at a time.', 'Apply the Hadamard matrix to a computational-basis state.', 'Explain how a unitary gate changes amplitudes while preserving normalization.'],
    formulas: '<ul><li><strong>(A|ψ⟩)<sub>i</sub> = Σⱼ A<sub>ij</sub>ψ<sub>j</sub></strong>.</li><li><strong>|ψ′⟩ = U|ψ⟩</strong> describes a gate acting on a state.</li><li><strong>H = (1/√2)[[1,1],[1,−1]]</strong> and <strong>H² = I</strong>.</li></ul>',
    workedExample: '<ol><li>Write <strong>|0⟩ = (1,0)ᵀ</strong>.</li><li>Multiply each row of H by the vector: <strong>H|0⟩ = (1/√2)(1·1 + 1·0, 1·1 − 1·0)ᵀ</strong>.</li><li>The result is <strong>(1,1)ᵀ/√2 = |+⟩</strong>. A second H returns |0⟩ because <strong>H² = I</strong>.</li></ol>',
    applications: '<p>Every gate application in a state-vector simulation is a matrix–vector product (or a structured equivalent that avoids forming a full matrix). This operation updates amplitudes before later gates and measurements.</p>',
    takeaways: ['Each output component is a row–vector dot product.', 'The matrix acts on the state from the left.', 'Gate order matters because matrix products need not commute.', 'A unitary gate preserves state normalization.']
  },
  'dirac-notation': {
    core: '<p>A ket |ψ⟩ is a state column vector; its bra ⟨ψ| is the conjugate transpose row. Inner products are scalars measuring overlap, while outer products are operators. The basis identity decomposes any state into its basis components.</p>',
    objectives: ['Translate between a state vector and ket notation.', 'Form bras, inner products, and outer-product operators.', 'Use orthogonality, normalization, and the identity resolution in quantum calculations.'],
    formulas: '<ul><li><strong>⟨ψ| = (|ψ⟩)†</strong>.</li><li><strong>⟨ϕ|ψ⟩</strong> is an inner product; <strong>|ψ⟩⟨ϕ|</strong> is an outer product.</li><li><strong>⟨ψ|ψ⟩ = 1</strong> for a normalized state.</li><li><strong>Σᵢ |i⟩⟨i| = I</strong> for a complete orthonormal basis.</li></ul>',
    workedExample: '<ol><li><strong>|+⟩ = (|0⟩ + |1⟩)/√2</strong> and <strong>|−⟩ = (|0⟩ − |1⟩)/√2</strong>.</li><li>Taking the bra of |+⟩ and evaluating the overlap gives <strong>⟨+|−⟩ = (1/2)(1 − 1) = 0</strong>; the states are orthogonal.</li><li>The projector is <strong>|+⟩⟨+| = (1/2)[[1,1],[1,1]]</strong>, a matrix that selects the |+⟩ component.</li></ol>',
    applications: '<p>Dirac notation makes circuit states, overlaps, projectors, and measurement updates compact. It is especially useful for multi-qubit registers, where basis labels such as |00⟩ and |11⟩ are easier to read than long column vectors.</p>',
    takeaways: ['Bras are conjugate transposes of kets.', 'Inner products return numbers; outer products return operators.', 'Orthogonal states have zero overlap.', 'A complete basis resolves the identity.']
  },
  'quantum-states-observables': {
    core: '<p>A pure state is a normalized ket. More generally, a density operator ρ describes pure or mixed states; it is positive and has trace one. An observable is Hermitian, and its spectral projectors determine possible outcomes and their probabilities.</p>',
    objectives: ['Distinguish pure-state kets from density operators.', 'Identify an observable’s eigenvalues and spectral projectors.', 'Calculate outcome probabilities from amplitudes or density matrices.'],
    formulas: '<ul><li><strong>|ψ⟩ = Σₓ αₓ|x⟩</strong> with <strong>Σₓ|αₓ|² = 1</strong>.</li><li><strong>ρ = |ψ⟩⟨ψ|</strong> for a pure state; <strong>tr(ρ) = 1</strong>.</li><li><strong>O = Σₖ oₖΠₖ</strong> is the spectral form of an observable.</li><li><strong>P(oₖ) = tr(ρΠₖ)</strong> gives an outcome probability.</li></ul>',
    workedExample: '<ol><li>For <strong>|ϕ⁺⟩ = (|00⟩ + |11⟩)/√2</strong>, the nonzero basis probabilities are <strong>|1/√2|² = 1/2</strong> for 00 and 11.</li><li>For <strong>ZZ</strong>, both 00 and 11 have eigenvalue +1.</li><li>Therefore <strong>P(+1) = 1/2 + 1/2 = 1</strong> and the joint observable returns +1 with certainty.</li></ol>',
    applications: '<p>State vectors or density matrices describe the system being processed. Observables connect that state to measured quantities such as qubit values, parity, or energy. Circuit algorithms prepare states and transform them so useful observable statistics can be estimated.</p>',
    takeaways: ['Quantum states must be normalized.', 'Observables are Hermitian operators.', 'Spectral projectors define outcome probabilities.', 'Entangled states can have correlations not captured by separate single-qubit states.']
  },
  'expectation-measurement': {
    core: '<p>A measurement yields one eigenvalue on an individual run. Repeating it on identically prepared states produces a distribution; the expectation is its mean, and variance or standard deviation describes its spread.</p>',
    objectives: ['Calculate an observable’s expectation value and variance.', 'Distinguish a single measurement outcome from an ensemble average.', 'Explain how repeated circuit shots estimate measurement statistics.'],
    formulas: '<ul><li><strong>⟨A⟩ = ⟨ψ|A|ψ⟩ = Σₖ aₖP(aₖ)</strong>.</li><li><strong>(ΔA)² = ⟨A²⟩ − ⟨A⟩²</strong>.</li><li><strong>ΔA = √((ΔA)²)</strong>.</li><li>For projective measurement, <strong>P(aₖ) = ⟨ψ|Πₖ|ψ⟩</strong>.</li></ul>',
    workedExample: '<ol><li>In <strong>|+⟩ = (|0⟩+|1⟩)/√2</strong>, measuring Z gives +1 and −1 with probability 1/2 each.</li><li>The mean is <strong>⟨Z⟩ = (1)(1/2) + (−1)(1/2) = 0</strong>.</li><li><strong>⟨Z²⟩ = 1</strong>, so the variance is <strong>1 − 0² = 1</strong> and the standard deviation is 1. In |0⟩, Z is certain and its standard deviation is 0.</li></ol>',
    applications: '<p>Expectation values estimate energies, Pauli correlations, and objective functions in quantum algorithms. A circuit typically estimates them from repeated shots; finite samples fluctuate around the ideal mean, so uncertainty and shot counts matter.</p>',
    takeaways: ['A single measurement is a sample, not the expectation value.', 'Expectation values are probability-weighted averages.', 'Variance measures spread and is nonnegative.', 'Repeated shots estimate ideal observable statistics.']
  },
  'quantum-dynamics-uncertainty': {
    core: '<p>The Hamiltonian H generates closed-system time evolution. For a time-independent Hermitian H, its exponential gives a unitary transformation. Uncertainty relations constrain the spreads of observables whose operators do not commute.</p>',
    objectives: ['Use the Hamiltonian to write the time-evolution operator.', 'Derive a simple state trajectory and its measurement probabilities.', 'Apply the Robertson uncertainty relation to incompatible observables.'],
    formulas: '<ul><li><strong>iℏ d|ψ⟩/dt = H|ψ⟩</strong> is the Schrödinger equation.</li><li><strong>U(t) = e<sup>−iHt/ℏ</sup></strong> and <strong>|ψ(t)⟩ = U(t)|ψ(0)⟩</strong>.</li><li><strong>ΔA ΔB ≥ (1/2)|⟨[A,B]⟩|</strong> is the Robertson uncertainty relation.</li></ul>',
    workedExample: '<ol><li>With <strong>H = X</strong> and ℏ = 1, use <strong>X² = I</strong> to expand <strong>e<sup>−itX</sup> = cos(t)I − i sin(t)X</strong>.</li><li>Acting on |0⟩ gives <strong>|ψ(t)⟩ = cos(t)|0⟩ − i sin(t)|1⟩</strong>; therefore <strong>P(0)=cos²(t)</strong> and <strong>P(1)=sin²(t)</strong>.</li><li>For |0⟩, <strong>[X,Y]=2iZ</strong> and ⟨Z⟩=1, so the uncertainty lower bound is 1; ΔX=ΔY=1 attains it.</li></ol>',
    applications: '<p>Hamiltonians model physical dynamics and compile into gate sequences that approximate time evolution. Uncertainty analysis helps interpret measurement limits and choose observables or experiments whose statistics reveal the desired properties.</p>',
    takeaways: ['A Hermitian Hamiltonian generates unitary evolution.', 'Matrix exponentials turn continuous dynamics into operators.', 'Uncertainty depends on both state and observables.', 'Noncommuting observables can impose a nonzero lower bound.']
  },
  'sequential-measurement': {
    core: '<p>After a projective measurement with outcome projector Π, a pure state becomes Π|ψ⟩/√P when P is nonzero. Sequential outcome probabilities depend on this updated state. Post-selection keeps only runs matching a specified outcome and must account for the success probability.</p>',
    objectives: ['Update a state after a specified projective measurement.', 'Calculate joint and conditional probabilities for a measurement sequence.', 'Explain post-selection and report its success probability.'],
    formulas: '<ul><li><strong>P(k) = ⟨ψ|Πₖ|ψ⟩</strong>.</li><li><strong>|ψ′⟩ = Πₖ|ψ⟩/√P(k)</strong> is the normalized post-measurement state.</li><li><strong>P(j then k) = ∥ΠₖΠⱼ|ψ⟩∥²</strong> for successive projective outcomes.</li><li>For a selected event E and later outcome F, <strong>P(F|E)=P(F∩E)/P(E)</strong>.</li></ul>',
    workedExample: '<ol><li>Start in |0⟩, the +z eigenstate, so the first +z result has probability 1.</li><li>Measuring x next gives +x or −x with probability 1/2 each.</li><li>Either x eigenstate gives +z or −z with probability 1/2 at the final z analyser. Thus each complete path has probability <strong>1·(1/2)·(1/2)=1/4</strong>.</li><li>If only the +z then +x runs are retained, the final z outcomes are conditionally 1/2 each; each joint path remains 1/4 of all initial runs.</li></ol>',
    applications: '<p>Mid-circuit measurements and classical feed-forward use this state-update rule in quantum circuits. Post-selection is useful in some demonstrations and protocols, but it discards runs, so success rates and conditional probabilities must be reported.</p>',
    takeaways: ['Measurement changes the state used by later operations.', 'Sequential probabilities use conditional state updates.', 'Post-selection conditions on a subset of runs.', 'Distinguish joint probabilities from probabilities conditioned on success.']
  },
  'mathematical-explorers': {
    core: '<p>Interactive explorers let learners vary a state, operator, or measurement and observe the resulting geometry or statistics. They are visual aids for the same linear algebra and probability rules, not substitutes for derivation or evidence.</p>',
    objectives: ['Identify which mathematical concept an explorer visualizes.', 'Generate and open an explorer with the documented Sia Script interface.', 'Connect a visual change to its equations and distinguish illustration from proof.'],
    formulas: '<ul><li><strong>|ψ⟩ = Σₓ αₓ|x⟩</strong> represents a state in a basis.</li><li><strong>P(x)=|αₓ|²</strong> links amplitudes to measurement statistics.</li><li><strong>|ψ′⟩=U|ψ⟩</strong> shows how a gate transforms the state.</li><li><strong>U†U=I</strong> is the norm-preservation condition for a unitary gate.</li></ul>',
    workedExample: '<ol><li>Choose an explorer such as <strong>phasor</strong> and generate it using the documented Sia Script call.</li><li>Inspect the returned filename, then open the generated HTML page in a browser.</li><li>Change one control at a time and connect the visual change to the associated equation or state representation.</li><li>Use the displayed values as an illustration; verify conclusions with the mathematical definitions and, when needed, the recorded Sia Script outputs.</li></ol>',
    applications: '<p>Explorers support intuition for complex phase, matrix transformations, state evolution, interference, and measurement. In algorithm study, visualizing a state or circuit can help form a hypothesis before checking it algebraically or with a simulator.</p>',
    takeaways: ['An explorer is an interactive aid, not a proof.', 'Change one parameter at a time to see cause and effect.', 'Relate every visualization to its formula and assumptions.', 'The documented Sia Script call returns a page filename.']
  }
};

function renderStructuredMathLesson(topic, lesson, guide, lessonClass) {
  if (!guide) throw new Error(`Missing mathematical lesson guide: ${topic.slug}`);
  const escapeText = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const examples = (lesson.examples || []).map((example) => {
    const codeExplanation = Array.isArray(example.codeExplanation)
      ? `<ol class="vectors-code-explanation">${example.codeExplanation.map((line) => `<li>${line}</li>`).join('')}</ol>`
      : `<p>${example.codeExplanation}</p>`;
    return `<section class="qubit-section complex-example">
      <h2>${escapeText(example.title)}</h2>
      ${example.concept ? `<div class="complex-example-step"><h3>Concept</h3><p>${example.concept}</p></div>` : ''}
      <div class="complex-example-step"><h3>Sia Script Code</h3><pre class="hdqs-code"><code>${escapeText(example.code)}</code></pre></div>
      <div class="complex-example-step"><h3>Code Output</h3><pre class="hdqs-output"><code>${escapeText(example.output)}</code></pre>${example.image ? `<figure class="documented-output-figure"><img src="${escapeText(example.image)}" alt="${escapeText(example.imageAlt)}"><figcaption>${escapeText(example.imageCaption)}</figcaption></figure>` : ''}</div>
      <div class="complex-example-step"><h3>Code Explanation</h3>${codeExplanation}</div>
      <div class="complex-example-step"><h3>Output Explanation</h3><p>${example.outputExplanation}</p></div>
    </section>`;
  }).join('');
  return `<section class="qubit-lesson math-lesson ${lessonClass} documented-math-lesson">
    <section class="qubit-section">
      <h2>Introduction</h2>
      <p>${escapeText(topic.intro)}</p>
    </section>
    <section class="qubit-section">
      <h2>Learning Objectives</h2>
      <ul>${guide.objectives.map((item) => `<li>${escapeText(item)}</li>`).join('')}</ul>
    </section>
    <section class="qubit-section complex-concept">
      <h2>Core Concepts</h2>
      <p>${lesson.concept}</p>
      ${guide.core || ''}
    </section>
    <section class="qubit-section tensor-foundations">
      <h2>Mathematical Foundations</h2>
      ${lesson.foundation}
    </section>
    <section class="qubit-section">
      <h2>Important Formulas</h2>
      ${guide.formulas}
    </section>
    <section class="qubit-section">
      <h2>Step-by-Step Examples</h2>
      ${guide.workedExample}
    </section>
    <section class="qubit-section">
      <h2>Applications in Quantum Computing</h2>
      ${guide.applications}
    </section>
    ${examples}
    <aside class="key-idea">
      <h2>Key Takeaways</h2>
      <ul>${guide.takeaways.map((item) => `<li>${escapeText(item)}</li>`).join('')}</ul>
    </aside>
  </section>`;
}

function documentedMathLessonTemplate(topic) {
  const lesson = documentedMathLessons[topic.slug];
  if (!lesson) throw new Error(`Missing documented mathematics lesson: ${topic.slug}`);
  return renderStructuredMathLesson(topic, lesson, mathLessonGuides[topic.slug], 'complex-numbers-lesson');
}

function topicTemplate(topicIndex) {
  const topics = [
    fundamentalsIntroductionTemplate(),
    `<section class="qubit-lesson">
      <div class="qubit-section"><h2>The qubit is quantum information's small compass.</h2><p>A qubit has two familiar basis states, <strong>|0⟩</strong> and <strong>|1⟩</strong>. Unlike a classical bit, its complete state can include a carefully described combination of both.</p></div>
      <div class="qubit-section"><h2>Two states, one system</h2><p><strong>|0⟩</strong> and <strong>|1⟩</strong> are the computational basis states of a qubit. They are the reference states used to describe and measure a quantum system.</p><div class="basis-grid"><div class="basis-card"><strong>|0⟩</strong><span>Basis state 0</span></div><div class="basis-card"><strong>|1⟩</strong><span>Basis state 1</span></div></div></div>
      <div class="qubit-section"><h2>A qubit can exist in superposition</h2><p>A general single-qubit state is represented as:</p><div class="qubit-equation">|ψ⟩ = α|0⟩ + β|1⟩</div><ul><li>α and β are complex probability amplitudes.</li><li>|α|² is the probability of measuring 0.</li><li>|β|² is the probability of measuring 1.</li><li>|α|² + |β|² = 1.</li></ul></div>
      <div class="qubit-section"><h2>What do the amplitudes mean?</h2><div class="probability-grid"><div><strong>P(0) = |α|²</strong><span>Probability of measuring 0</span></div><div><strong>P(1) = |β|²</strong><span>Probability of measuring 1</span></div></div><p>For example:</p><div class="qubit-equation">|ψ⟩ = 1/√2 |0⟩ + 1/√2 |1⟩</div><p>This state gives <strong>P(0) = 50%</strong> and <strong>P(1) = 50%</strong>.</p></div>
      <div class="qubit-section"><h2>Superposition is not simply '0 and 1 at the same time'</h2><p>A qubit is described by a quantum state containing amplitudes for possible measurement outcomes. Measurement samples that state and produces one classical result.</p><div class="state-flow"><span>Quantum state</span><b>↓</b><strong>|ψ⟩ = α|0⟩ + β|1⟩</strong><b>↓</b><span>Measurement</span><div><i>↙</i><i>↘</i></div><div><em>0</em><em>1</em></div></div></div>
      <div class="qubit-section"><h2>Phase matters</h2><p>Relative phase can distinguish states even when their computational-basis probabilities match.</p><div class="phase-grid"><div>|ψ₁⟩ = 1/√2(|0⟩ + |1⟩)</div><div>|ψ₂⟩ = 1/√2(|0⟩ − |1⟩)</div></div><p>These states have the same probabilities when measured in the computational basis, but they are different quantum states because of their relative phase. Interference makes that difference observable.</p></div>
      <div class="qubit-section"><h2>Visualizing a qubit</h2><p>A single qubit can be represented geometrically using the Bloch sphere. <strong>|0⟩</strong> is at the north pole, <strong>|1⟩</strong> is at the south pole, and other pure qubit states appear on the surface.</p><div class="bloch-wrap"><div class="bloch-sphere" aria-label="Bloch sphere showing zero at the north pole and one at the south pole"><span class="bloch-axis"></span><span class="bloch-equator"></span><b class="bloch-zero">|0⟩</b><b class="bloch-one">|1⟩</b><span class="bloch-state">|ψ⟩</span></div><div class="bloch-labels"><span>north pole</span><span>south pole</span></div></div><div class="qubit-equation">|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩</div></div>
      <div class="qubit-section"><h2>Qubit vs Classical Bit</h2><div class="comparison-grid"><div><h3>Classical Bit</h3><ul><li>Stores 0 or 1</li><li>Definite classical state</li><li>Classical logic operations</li></ul></div><div><h3>Qubit</h3><ul><li>State described by α|0⟩ + β|1⟩</li><li>Can exist in superposition</li><li>Has probability amplitudes and phase</li><li>Manipulated using quantum operations</li></ul></div></div></div>
      <div class="qubit-section"><h2>What happens when we measure a qubit?</h2><p>Measurement converts the quantum state into a classical result. For <strong>|ψ⟩ = α|0⟩ + β|1⟩</strong>, measurement gives 0 with probability |α|² or 1 with probability |β|².</p><div class="measure-flow"><strong>|ψ⟩</strong><span>↓</span><strong>Measurement</strong><div><i>↙</i><i>↘</i></div><div><em>0</em><em>1</em></div></div></div>
      <div class="qubit-section"><h2>One qubit → many qubits</h2><div class="state-counts"><span>1 qubit → <strong>2</strong> basis states</span><span>2 qubits → <strong>4</strong> basis states</span><span>3 qubits → <strong>8</strong> basis states</span><span>n qubits → <strong>2ⁿ</strong> basis states</span></div><div class="basis-line">|00⟩ &nbsp; |01⟩ &nbsp; |10⟩ &nbsp; |11⟩</div><p>For n qubits, the computational basis contains 2ⁿ states. This does <strong>not</strong> mean n qubits simply store 2ⁿ classical bits. The quantum system is described using amplitudes associated with those basis states.</p></div>
      <div class="qubit-section"><h2>Where do physical qubits come from?</h2><p>Qubits can be built from several physical systems, each with different engineering tradeoffs:</p><ul class="hardware-list"><li>Superconducting circuits</li><li>Trapped ions</li><li>Photons</li><li>Neutral atoms</li><li>Spin-based qubits</li></ul></div>
      <aside class="key-idea"><span class="card-label">Key idea</span><p>A qubit is not simply a faster version of a classical bit. It is a quantum system whose state is described by amplitudes, allowing superposition, phase, interference, and, when multiple qubits interact, entanglement.</p></aside>
    </section>`,
    superpositionLessonTemplate(),
    entanglementLessonTemplate(),
    measurementLessonTemplate()
  ];
  return topics[topicIndex];
}

function renderContents() {
  // Page contents are presented in the lesson body; the side panel was removed.
}

function wireInteractions(index) {
  document.querySelectorAll('[data-lesson-topic]').forEach((button) => button.addEventListener('click', () => loadTopic(Number(button.dataset.lessonTopic))));
  const stateSlider = $('#fundamentals-state-slider');
  if (stateSlider) stateSlider.addEventListener('input', (event) => {
    const value = Number(event.target.value);
    const probability = Math.round(value);
    $('#fundamentals-state-value').textContent = `${100 - probability}% |0⟩ + ${probability}% |1⟩`;
    $('#fundamentals-state-zero').style.height = `${100 - probability}%`;
    $('#fundamentals-state-one').style.height = `${probability}%`;
    $('#fundamentals-state-probability').textContent = `P(1) = ${probability}%`;
  });
  const measureButton = $('#fundamentals-measure-button');
  if (measureButton) measureButton.addEventListener('click', () => {
    const result = Math.random() < .5 ? '0' : '1';
    $('#fundamentals-measure-result').textContent = result;
    $('#fundamentals-measure-feedback').textContent = `One measurement returned ${result}. Run it again to see the distribution emerge.`;
  });
  const entangledMeasureButton = $('#measure-entangled-button');
  if (entangledMeasureButton) entangledMeasureButton.addEventListener('click', () => {
    const result = Math.random() < .5 ? '0' : '1';
    $('#entangled-qubit-a').textContent = `|${result}⟩`;
    $('#entangled-qubit-b').textContent = `|${result}⟩`;
    $('#entangled-measurement-note').textContent = `Measured ${result}${result}. Both qubits match because this simulation represents |Φ⁺⟩.`;
  });
  const measureQubitButton = $('#measure-qubit-button');
  if (measureQubitButton) measureQubitButton.addEventListener('click', () => {
    const result = Math.random() < .5 ? '0' : '1';
    $('#measurement-state').textContent = `|${result}⟩`;
    $('#measurement-result-note').textContent = `Measured ${result}. The qubit is now in |${result}⟩; measure again to run another independent trial.`;
  });
  document.querySelectorAll('[data-fundamental-answer]').forEach((button) => button.addEventListener('click', () => {
    const correct = button.dataset.fundamentalAnswer === 'true';
    document.querySelectorAll('[data-fundamental-answer]').forEach((item) => item.disabled = true);
    button.classList.add(correct ? 'correct' : 'wrong');
    $('#fundamentals-quiz-feedback').textContent = correct ? 'Correct. The amplitudes are complex numbers; their squared magnitudes give measurement probabilities.' : 'Not quite. Amplitudes describe the state, while squared magnitudes become probabilities.';
  }));
  const slider = $('#probability-slider');
  if (slider) slider.addEventListener('input', (event) => {
    const value = Number(event.target.value);
    const zero = 100 - value;
    const legacyReadout = $('#probability-value');
    const legacyQubit = $('#qubit-super');
    const superpositionZero = $('#superposition-zero');
    const superpositionOne = $('#superposition-one');
    if (legacyReadout) legacyReadout.textContent = `${zero} / ${value}`;
    if (legacyQubit) legacyQubit.style.transform = `rotate(${(value - 50) / 2}deg) scale(${1 + Math.abs(value - 50) / 500})`;
    if (superpositionZero) superpositionZero.textContent = `P(0) = ${zero}%`;
    if (superpositionOne) superpositionOne.textContent = `P(1) = ${value}%`;
  });
  const amplitude = $('#amplitude-slider');
  if (amplitude) amplitude.addEventListener('input', (event) => { const value = Number(event.target.value); $('#amplitude-value').textContent = `${value}%`; $('#amp-zero').style.height = `${100 - value}%`; $('#amp-one').style.height = `${value}%`; });
  document.querySelectorAll('[data-gate]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('[data-gate]').forEach((item) => item.classList.remove('active')); button.classList.add('active'); const gate = button.dataset.gate; $('#active-gate').textContent = gate; $('#output-gate').textContent = gate === 'H' ? '0+1' : gate === 'X' ? '1' : '−'; $('#output-gate').style.fontSize = gate === 'H' ? '12px' : '24px'; }));
  document.querySelectorAll('.quiz-option').forEach((button) => button.addEventListener('click', () => { const correct = button.dataset.correct === 'true'; document.querySelectorAll('.quiz-option').forEach((item) => item.disabled = true); button.classList.add(correct ? 'correct' : 'wrong'); $('#quiz-feedback').textContent = correct ? 'Exactly. Measurement turns possibility into a definite result.' : 'Close. A qubit resolves to one result when we measure it.'; if (correct) completeChapter(index); }));
  const reflectionButton = $('#reflection-button');
  if (reflectionButton) reflectionButton.addEventListener('click', () => { completeChapter(index); $('#reflection-feedback').textContent = 'Chapter saved to your progress.'; reflectionButton.textContent = 'Chapter complete ✓'; });
}

function fundamentalsIntroductionTemplate() {
  return `<section class="fundamentals-lesson">
    <div class="fundamentals-section">
      <h2>What is Quantum Computing?</h2>
      <p>Quantum computing is a way of processing information using the rules of quantum mechanics. Instead of treating information as only definite 0s and 1s, a quantum computer prepares, transforms, and measures <strong>quantum states</strong>.</p>
      <p>The goal is not to try every answer at once. The goal is to choreograph <strong>superposition</strong>, <strong>interference</strong>, and <strong>entanglement</strong> so useful answers become more likely when the system is measured.</p>
    </div>
    <div class="fundamentals-section">
      <h2>Classical Computing vs Quantum Computing</h2>
      <div class="fundamentals-comparison">
        <div><strong>Classical bit</strong><span>Stores one definite value: 0 or 1.</span><code>bit = 1</code></div>
        <div><strong>Qubit</strong><span>Uses amplitudes to describe a state built from |0⟩ and |1⟩.</span><code>|ψ⟩ = α|0⟩ + β|1⟩</code></div>
      </div>
      <p>A classical computer manipulates bits with logic gates. A quantum computer manipulates amplitudes with reversible quantum gates, then uses measurement to produce ordinary classical data.</p>
    </div>
    <div class="fundamentals-section">
      <h2>The qubit: a quantum unit of information</h2>
      <p>The basis states <strong>|0⟩</strong> and <strong>|1⟩</strong> are the quantum version of the two classical values. This notation gives us a compact language for describing <strong>quantum states</strong>. A general single-qubit state is written as:</p>
      <div class="fundamentals-formula">|ψ⟩ = α|0⟩ + β|1⟩<small>where α and β are complex amplitudes</small></div>
      <p>For a valid state, the total probability must equal one:</p>
      <div class="fundamentals-formula">|α|² + |β|² = 1<small>the normalization rule</small></div>
      <p>When measured in the computational basis, the probability of observing 0 is <strong>|α|²</strong>, and the probability of observing 1 is <strong>|β|²</strong>.</p>
    </div>
    <div class="fundamentals-section fundamentals-interactive">
      <div><h2>Explore a quantum state</h2><p>Move the slider to change the probability of measuring 1. The state remains a quantum description until measurement.</p></div>
      <div class="fundamentals-state-visual"><div class="fundamentals-bar"><span id="fundamentals-state-zero"></span><small>|0⟩</small></div><div class="fundamentals-bar one"><span id="fundamentals-state-one"></span><small>|1⟩</small></div></div>
      <label class="fundamentals-range"><span>0</span><input id="fundamentals-state-slider" type="range" min="0" max="100" value="50"><span>1</span></label>
      <div class="fundamentals-state-readout"><strong id="fundamentals-state-value">50% |0⟩ + 50% |1⟩</strong><span id="fundamentals-state-probability">P(1) = 50%</span></div>
    </div>
    <div class="fundamentals-section">
      <h2>Superposition and interference</h2>
      <p><strong>Superposition</strong> means a state can contain amplitudes for multiple outcomes. Those amplitudes behave like waves: quantum gates can make them reinforce one another or cancel one another.</p>
      <p>This interference is the source of quantum advantage in algorithms. A useful algorithm arranges the interference so the outcomes that answer its question are amplified.</p>
      <div class="fundamentals-diagram" aria-label="A visual showing amplitudes combining through interference"><span class="wave wave-a">∿</span><span class="plus">+</span><span class="wave wave-b">∿</span><span class="equals">=</span><span class="wave wave-result">∿∿</span><small>amplitudes combine before measurement</small></div>
    </div>
    <div class="fundamentals-section">
      <h2>Entanglement</h2>
      <p><strong>Entanglement</strong> is a shared quantum state that cannot be fully described by assigning an independent state to each qubit. A familiar example is:</p>
      <div class="fundamentals-formula">|Φ⁺⟩ = (|00⟩ + |11⟩) / √2<small>the two results are correlated when measured</small></div>
      <p>If one qubit in this pair is measured as 0, the other is also found as 0. If it is measured as 1, the other is also 1. Entanglement creates correlations; it does not allow faster-than-light communication.</p>
    </div>
    <div class="fundamentals-section fundamentals-measurement">
      <div><h2>Measurement</h2><p>Measurement converts a quantum state into a classical result. For a state α|0⟩ + β|1⟩, one run returns either 0 or 1, with probabilities |α|² and |β|².</p></div>
      <div class="measurement-demo"><div class="measurement-result" id="fundamentals-measure-result">?</div><button class="gate-button" id="fundamentals-measure-button" type="button">Measure once</button><p id="fundamentals-measure-feedback">A measurement samples the state and gives one definite result.</p></div>
    </div>
    <div class="fundamentals-section">
      <h2>Why quantum computing is important</h2>
      <p>Quantum computers are promising for problems whose structure is naturally quantum or where carefully designed interference can reveal hidden patterns. They are not faster for every task, and useful machines remain difficult to build.</p>
      <div class="fundamentals-applications"><span>Drug discovery</span><span>Materials science</span><span>Optimization research</span><span>Quantum simulation</span><span>Secure communications</span><span>Precision sensing</span></div>
      <p>These are possible <strong>real-world applications</strong>, not guaranteed advantages. In practice, the most credible near-term value comes from exploring chemistry, materials, sensing, and hybrid quantum-classical methods alongside continued research.</p>
    </div>
    <div class="fundamentals-quiz"><span class="card-label">Quick check</span><h3>What do |α|² and |β|² represent?</h3><div class="quiz-options"><button type="button" data-fundamental-answer="false">The names of two quantum gates.</button><button type="button" data-fundamental-answer="true">The probabilities of measuring 0 and 1.</button><button type="button" data-fundamental-answer="false">Two classical bits stored in one qubit.</button></div><p id="fundamentals-quiz-feedback"></p></div>
  </section>`;
}

function highlightBasicCircuitCode(source) {
  const keywords = new Set(['from', 'import', 'print', 'for', 'in', 'try', 'except', 'as']);
  const tokenPattern = /("""[\s\S]*?"""|#[^\r\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:from|import|print|for|in|try|except|as)\b|\b\d+(?:\.\d+)?\b)/g;
  return source.split(tokenPattern).map((token) => {
    if (!token) return '';
    const className = token.startsWith('#') ? 'token-comment'
      : token.startsWith('"') || token.startsWith("'") ? 'token-string'
        : keywords.has(token) ? 'token-keyword'
          : /^\d/.test(token) ? 'token-number'
            : '';
    const escaped = escapeCode(token);
    return className ? `<span class="${className}">${escaped}</span>` : escaped;
  }).join('');
}

function basicCircuitExample(id, title, concept, code, output, codeExplanation, outputExplanation) {
  const heading = title.replace(/^Example\s+\d+\s*[·.:—-]\s*/i, '');
  return `<div class="basic-circuit-example">
    <h4 id="${id}">${heading}</h4>
    <p class="basic-example-concept"><strong>Concept:</strong> ${concept}</p>
    <p class="card-label">Sia Script Code · Python</p>
    <pre class="hdqs-code"><code class="language-python">${highlightBasicCircuitCode(code)}</code></pre>
    <p class="card-label">Output</p>
    <pre class="hdqs-output"><code>${escapeCode(output)}</code></pre>
    <p class="card-label">Code Explanation</p>
    <ul class="code-explanation">${codeExplanation.map((line) => `<li>${line}</li>`).join('')}</ul>
    <p class="card-label">Output Explanation</p>
    <p>${outputExplanation}</p>
  </div>`;
}

function basicCircuitVisual(name) {
  const visuals = {
    hadamard: `<figure class="basic-circuit-visual">
      <svg viewBox="0 0 430 74" role="img" aria-labelledby="hadamard-circuit-title hadamard-circuit-desc">
        <title id="hadamard-circuit-title">Hadamard superposition circuit</title>
        <desc id="hadamard-circuit-desc">A qubit in zero passes through an H gate and is sampled, producing zero or one.</desc>
        <text x="12" y="41">q₀: |0⟩</text><line x1="75" y1="36" x2="165" y2="36" class="circuit-wire"/>
        <rect x="165" y="17" width="42" height="38" rx="4" class="circuit-gate"/>
        <text x="186" y="42" text-anchor="middle" class="circuit-gate-label">H</text>
        <line x1="207" y1="36" x2="290" y2="36" class="circuit-wire"/>
        <circle cx="310" cy="36" r="15" class="circuit-measure"/>
        <text x="310" y="41" text-anchor="middle" class="circuit-measure-label">M</text>
        <line x1="325" y1="36" x2="352" y2="36" class="circuit-wire"/>
        <text x="360" y="41">0 / 1</text>
      </svg>
      <figcaption>One Hadamard gate prepares equal amplitudes; measurement samples one classical result.</figcaption>
    </figure>`,
    bell: `<figure class="basic-circuit-visual">
      <svg viewBox="0 0 500 112" role="img" aria-labelledby="bell-circuit-title bell-circuit-desc">
        <title id="bell-circuit-title">Bell state preparation circuit</title>
        <desc id="bell-circuit-desc">Hadamard on qubit zero followed by controlled X from qubit zero to qubit one.</desc>
        <text x="12" y="39">q₀: |0⟩</text><text x="12" y="86">q₁: |0⟩</text>
        <line x1="75" y1="34" x2="130" y2="34" class="circuit-wire"/>
        <line x1="75" y1="81" x2="250" y2="81" class="circuit-wire"/>
        <rect x="130" y="15" width="42" height="38" rx="4" class="circuit-gate"/>
        <text x="151" y="40" text-anchor="middle" class="circuit-gate-label">H</text>
        <line x1="172" y1="34" x2="250" y2="34" class="circuit-wire"/>
        <line x1="270" y1="34" x2="270" y2="81" class="circuit-control-line"/>
        <circle cx="270" cy="34" r="6" class="circuit-control"/>
        <circle cx="270" cy="81" r="13" class="circuit-target"/>
        <line x1="270" y1="70" x2="270" y2="92" class="circuit-target-mark"/>
        <line x1="259" y1="81" x2="281" y2="81" class="circuit-target-mark"/>
        <line x1="276" y1="34" x2="372" y2="34" class="circuit-wire"/>
        <line x1="283" y1="81" x2="372" y2="81" class="circuit-wire"/>
        <circle cx="389" cy="34" r="14" class="circuit-measure"/><text x="389" y="39" text-anchor="middle" class="circuit-measure-label">M</text>
        <circle cx="389" cy="81" r="14" class="circuit-measure"/><text x="389" y="86" text-anchor="middle" class="circuit-measure-label">M</text>
        <text x="415" y="39">00/11</text>
      </svg>
      <figcaption>H creates two branches; CX correlates them, so the ideal Bell-state samples are 00 or 11.</figcaption>
    </figure>`,
    ghz: `<figure class="basic-circuit-visual">
      <svg viewBox="0 0 510 176" role="img" aria-labelledby="ghz-circuit-title ghz-circuit-desc">
        <title id="ghz-circuit-title">Five-qubit GHZ preparation circuit</title>
        <desc id="ghz-circuit-desc">Hadamard on the first qubit and a chain of controlled-X gates linking each qubit in order.</desc>
        <text x="8" y="29">q₀: |0⟩</text><text x="8" y="60">q₁: |0⟩</text><text x="8" y="91">q₂: |0⟩</text><text x="8" y="122">q₃: |0⟩</text><text x="8" y="153">q₄: |0⟩</text>
        <line x1="70" y1="24" x2="108" y2="24" class="circuit-wire"/>
        <line x1="70" y1="55" x2="170" y2="55" class="circuit-wire"/>
        <line x1="70" y1="86" x2="230" y2="86" class="circuit-wire"/>
        <line x1="70" y1="117" x2="290" y2="117" class="circuit-wire"/>
        <line x1="70" y1="148" x2="350" y2="148" class="circuit-wire"/>
        <rect x="108" y="6" width="36" height="36" rx="4" class="circuit-gate"/><text x="126" y="30" text-anchor="middle" class="circuit-gate-label">H</text>
        <line x1="162" y1="24" x2="162" y2="55" class="circuit-control-line"/><circle cx="162" cy="24" r="5" class="circuit-control"/><circle cx="162" cy="55" r="10" class="circuit-target"/><path d="M162 47v16m-8-8h16" class="circuit-target-mark"/>
        <line x1="222" y1="55" x2="222" y2="86" class="circuit-control-line"/><circle cx="222" cy="55" r="5" class="circuit-control"/><circle cx="222" cy="86" r="10" class="circuit-target"/><path d="M222 78v16m-8-8h16" class="circuit-target-mark"/>
        <line x1="282" y1="86" x2="282" y2="117" class="circuit-control-line"/><circle cx="282" cy="86" r="5" class="circuit-control"/><circle cx="282" cy="117" r="10" class="circuit-target"/><path d="M282 109v16m-8-8h16" class="circuit-target-mark"/>
        <line x1="342" y1="117" x2="342" y2="148" class="circuit-control-line"/><circle cx="342" cy="117" r="5" class="circuit-control"/><circle cx="342" cy="148" r="10" class="circuit-target"/><path d="M342 140v16m-8-8h16" class="circuit-target-mark"/>
        <line x1="144" y1="24" x2="402" y2="24" class="circuit-wire"/><line x1="172" y1="55" x2="402" y2="55" class="circuit-wire"/><line x1="232" y1="86" x2="402" y2="86" class="circuit-wire"/><line x1="292" y1="117" x2="402" y2="117" class="circuit-wire"/><line x1="352" y1="148" x2="402" y2="148" class="circuit-wire"/>
        <text x="414" y="91">CX chain</text>
      </svg>
      <figcaption>Each CX extends the correlation by one qubit; the documented five-qubit output contains only 00000 and 11111.</figcaption>
    </figure>`,
    wState: `<figure class="basic-circuit-visual basic-w-state">
      <div class="w-state-term"><strong>|001⟩</strong><span class="w-state-bar"><i></i></span><small>amplitude 0.577 · probability 33.3%</small></div>
      <div class="w-state-term"><strong>|010⟩</strong><span class="w-state-bar"><i></i></span><small>amplitude 0.577 · probability 33.3%</small></div>
      <div class="w-state-term"><strong>|100⟩</strong><span class="w-state-bar"><i></i></span><small>amplitude 0.577 · probability 33.3%</small></div>
      <figcaption>|W₃⟩ = (|001⟩ + |010⟩ + |100⟩) / √3: one excitation is shared equally across three basis states.</figcaption>
    </figure>`,
    bellProbabilities: `<figure class="basic-circuit-visual basic-probability-visual">
      <div><span>|00⟩</span><i><b style="width:50%"></b></i><strong>50%</strong></div>
      <div><span>|01⟩</span><i><b style="width:0%"></b></i><strong>0%</strong></div>
      <div><span>|10⟩</span><i><b style="width:0%"></b></i><strong>0%</strong></div>
      <div><span>|11⟩</span><i><b style="width:50%"></b></i><strong>50%</strong></div>
      <figcaption>Bell-state probability bars from Example 52; only |00⟩ and |11⟩ have nonzero probability.</figcaption>
    </figure>`
  };
  return visuals[name];
}

function basicCircuitsLessonTemplate() {
  const example = basicCircuitExample;
  return `<section class="gates-lesson math-lesson circuit-lesson basic-circuits-lesson">
    <section class="qubit-section">
      <h2>Introduction to Quantum Circuits</h2>
      <p>A quantum circuit is an ordered program for preparing a register, applying gates, and sampling or inspecting its resulting state. A circuit makes the computation explicit: the register is the system, each chained gate transforms it, and measurement converts the final state into classical data.</p>
      <h3>What is a Quantum Circuit?</h3>
      <p>Read each wire from left to right. A gate applies a transformation to the current quantum state; a multi-qubit gate acts on the joint state. If gates U₁, U₂, …, Uₖ are applied in that order, then |ψ<sub>final</sub>⟩ = Uₖ⋯U₂U₁|ψ<sub>initial</sub>⟩. Sampling repeats the measurement to estimate outcome frequencies.</p>
      <h3>Quantum Registers and Qubits</h3>
      <p>A register holds a chosen number of qubits. An n-qubit register starts in |0…0⟩ and has 2ⁿ computational-basis states. Each qubit is addressed by an index beginning at 0, so a two-qubit register uses q₀ and q₁.</p>
      <h3>Creating a Quantum Register Using <code>hdqs(n)</code></h3>
      <p>The reference creates a register with <code>hdqs(n)</code>. Here n is the number of qubits; the returned register is the object on which the documented gate and inspection methods operate.</p>
      <h3>Gate Chaining and Circuit Execution</h3>
      <p>Each gate returns the register, so calls can be chained from initialization through measurement. Example 46 demonstrates the complete pattern: create one qubit, apply H to qubit 0, and request 1,000 samples.</p>
      ${example('example-46-intro', 'Example 46 · Register, gate chain, and execution', 'The code introduces hdqs(n), the gate chain, and sample(1000). The recorded counts are a single run of a fair quantum coin.', ['from sia import hdqs', 'print(hdqs(1).h(0).sample(1000))'].join('\n'), "{'0': 488, '1': 512}", [
        'Line 1 imports the documented hdqs entry point from Sia Script.',
        'Line 2 creates a one-qubit register with hdqs(1), applies the Hadamard gate to qubit index 0 with h(0), samples 1,000 measurements, and prints the returned outcome-count dictionary.'
      ], 'The run recorded 488 zeros and 512 ones, close to the ideal 500/500 split. Sampling is probabilistic, so these exact counts are not guaranteed on another unseeded run.') }
    </section>

    <section class="qubit-section">
      <h2>Superposition and Single-Qubit Circuits</h2>
      <p>A single-qubit circuit can change a basis state into a superposition. The Hadamard gate maps |0⟩ to |+⟩ = (|0⟩ + |1⟩)/√2, giving equal probabilities, P(0) = P(1) = 1/2. Measurement returns one bit per shot; a collection of shots reveals the distribution.</p>
      <h3>Creating Superposition Using the Hadamard Gate</h3>
      <p>H creates two equal probability amplitudes from |0⟩. The circuit below shows the register, gate, and sampling step described in the reference.</p>
      ${basicCircuitVisual('hadamard')}
      <h3>Quantum Coin Experiment</h3>
      <p>The Hadamard-prepared qubit behaves like a fair quantum coin when measured in the computational basis. Its individual result is 0 or 1; the distribution, rather than a single shot, expresses the balanced probabilities.</p>
      ${example('example-46-coin', 'Example 46 · Superposition: a fair quantum coin', 'The ideal probabilities are one half for each result. The PDF records one 1,000-shot sample; the observed counts may vary between executions unless a seed is used.', ['from sia import hdqs', 'print(hdqs(1).h(0).sample(1000))'].join('\n'), "{'0': 488, '1': 512}", [
        'Line 1 imports hdqs.',
        'In line 2, hdqs(1) creates one qubit, h(0) applies H to qubit 0, sample(1000) performs 1,000 shots, and print displays the counts.'
      ], 'The observed frequencies are 488/1,000 = 48.8% for 0 and 512/1,000 = 51.2% for 1. They estimate the ideal 50% / 50% distribution; they are not fixed theoretical counts.') }
      <h3>Sampling Measurement Results</h3>
      <p><code>sample(1000)</code> returns counts keyed by measured bit strings. For the one-qubit circuit the keys are “0” and “1”. The number passed to sample is the shot count, not the number of qubits.</p>
    </section>

    <section class="qubit-section">
      <h2>Entanglement and Multi-Qubit States</h2>
      <p>Multi-qubit state preparation uses gates on a joint register. A controlled-X (written <code>cx(control, target)</code>) flips its target when the control is 1. Acting on a superposition, it can correlate qubits and create entanglement.</p>
      <h3>Bell State Preparation</h3>
      <p>Starting from |00⟩, H on q₀ gives (|00⟩ + |10⟩)/√2. CX(0, 1) maps |10⟩ to |11⟩, preparing |Φ⁺⟩ = (|00⟩ + |11⟩)/√2.</p>
      ${basicCircuitVisual('bell')}
      ${example('example-47', 'Example 47 · Bell state: two qubits that always agree', 'An ideal measurement gives only 00 or 11. The reference output is one 1,000-shot run.', ['from sia import hdqs', 'print(hdqs(2).h(0).cx(0, 1).sample(1000))'].join('\n'), "{'00': 500, '11': 500}", [
        'Line 1 imports hdqs.',
        'Line 2 creates two qubits, applies H to qubit 0, applies controlled-X with control 0 and target 1, samples 1,000 runs, and prints the bit-string counts.'
      ], 'Only 00 and 11 appear in this ideal sample, with 500 counts each. The two results agree because the state is entangled; each individual qubit is not fixed to one outcome.') }
      <h3>GHZ State Preparation</h3>
      <p>The GHZ state generalizes the Bell correlation to more qubits: |GHZₙ⟩ = (|00…0⟩ + |11…1⟩)/√2. A CX ladder copies the first qubit’s branch coherently across the register.</p>
      ${basicCircuitVisual('ghz')}
      ${example('example-48', 'Example 48 · GHZ state on five qubits', 'The documented cx_chain() builds the CX ladder after H on qubit 0.', ['from sia import hdqs', 'print(hdqs(5).h(0).cx_chain().sample(1000))'].join('\n'), "{'11111': 505, '00000': 495}", [
        'Line 1 imports hdqs.',
        'Line 2 creates five qubits, puts qubit 0 into superposition, applies the documented CX chain, takes 1,000 samples, and prints the counts.'
      ], 'The sample contains only 00000 and 11111, with counts 495 and 505. This is the expected GHZ correlation; the exact ratio fluctuates between unseeded runs.') }
      <h3>W State Preparation</h3>
      <p>The three-qubit W state shares one excitation equally: |W₃⟩ = (|001⟩ + |010⟩ + |100⟩)/√3. Each displayed component has amplitude 1/√3 ≈ 0.577 and probability 1/3.</p>
      ${basicCircuitVisual('wState')}
      ${example('example-49', 'Example 49 · W state from the state library', 'The prepared-state library constructs the three-qubit W state directly.', ['from sia import hdqs', 'hdqs.prepare_state(\"w\", 3).show_state();'].join('\n'), [
        'State                 Amplitude       Prob',
        '|001                  0.577+0.000i    33.3%',
        '|010                  0.577+0.000i    33.3%',
        '|100                  0.577+0.000i    33.3%'
      ].join('\n'), [
        'Line 1 imports hdqs.',
        'Line 2 calls prepare_state(\"w\", 3) to create the documented three-qubit W state, then show_state() displays its nonzero amplitudes and probabilities. The trailing semicolon is present in the reference code.'
      ], 'The three listed basis states have equal amplitude and equal probability. The zero-amplitude basis states are omitted from this state display.') }
      <h3>Prepared-State Library</h3>
      <p>The reference library includes Bell, GHZ, W, and Plus states. The Bell example uses two qubits; the other examples use three. Probabilities are returned in computational-basis order.</p>
      ${example('example-50', 'Example 50 · Prepared-state library', 'The loop prepares each named state and rounds its probability vector to three decimal places.', ['from sia import hdqs', 'for kind in [\"bell\", \"ghz\", \"w\", \"plus\"]:', '    print(kind, hdqs.prepare_state(kind, 3 if kind != \"bell\" else 2).probabilities().round(3))'].join('\n'), [
        'bell [0.5   0.    0.    0.5]',
        'ghz  [0.5   0.    0.    0.    0.    0.    0.    0.5]',
        'w    [0.    0.333 0.333 0.    0.333 0.    0.    0.   ]',
        'plus [0.125 0.125 0.125 0.125 0.125 0.125 0.125 0.125]'
      ].join('\n'), [
        'Line 1 imports hdqs.',
        'Line 2 iterates over the four documented state names.',
        'Line 3 passes two qubits for bell and three for the other states, obtains probabilities(), rounds them to three decimals, and prints each label and vector.'
      ], 'Bell and GHZ place probability on their all-zero and all-one basis states. W places 1/3 on each one-excitation state. Plus distributes 1/8 across all eight three-qubit basis states.') }
    </section>

    <section class="qubit-section">
      <h2>Quantum State Representation</h2>
      <p>A pure n-qubit state is a vector of 2ⁿ complex amplitudes, one per computational-basis bit string. The probability of measuring basis state x is |αₓ|², and the probabilities sum to one. State inspection shows amplitudes that sampling counts alone cannot reveal.</p>
      <h3>Basis States</h3>
      <p>A bit string identifies a computational-basis state. The basis-state helper can prepare a requested bit string and return the probability of measuring it.</p>
      ${example('example-51', 'Example 51 · A basis state by its bit string', 'The reference prepares |101⟩ and queries the probability of that same outcome.', ['from sia import hdqs', 'print(hdqs.prepare_state(\"basis\", bits=\"101\").probability_of(\"101\"))'].join('\n'), '1.0', [
        'Line 1 imports hdqs.',
        'Line 2 calls prepare_state(\"basis\", bits=\"101\") to prepare the specified three-bit basis state, then probability_of(\"101\") queries the probability of that outcome and print displays it.'
      ], 'The result 1.0 means the prepared basis state is |101⟩ with certainty in the ideal state representation.') }
      <h3>State Vectors and Probability Amplitudes</h3>
      <p>For a Bell state, the amplitude vector in the ordered basis |00⟩, |01⟩, |10⟩, |11⟩ is (1/√2, 0, 0, 1/√2). The zero entries matter: those outcomes are absent from this ideal state.</p>
      ${example('example-54', 'Example 54 · The raw state vector', 'The state property exposes the complex amplitude vector; round(3) keeps the printed values concise.', ['from sia import hdqs', 'print(hdqs(2).h(0).cx(0, 1).state.round(3))'].join('\n'), '[0.707+0.j 0.   +0.j 0.   +0.j 0.707+0.j]', [
        'Line 1 imports hdqs.',
        'Line 2 prepares the Bell state, reads its state vector, rounds the complex entries to three decimals, and prints the vector.'
      ], 'The first and last entries are 0.707 ≈ 1/√2; the middle entries are zero. Squared magnitudes give probabilities 0.5, 0, 0, and 0.5.') }
      <h3>Quantum State Probabilities</h3>
      <p>Taking squared magnitudes converts amplitudes into probabilities. For example, |0.707|² ≈ 0.5. Probability methods report the full distribution or the probability for a selected bit string.</p>
      ${example('example-55', 'Example 55 · Exact probabilities and one outcome', 'Two Hadamard gates prepare an equal superposition over four basis states.', ['from sia import hdqs', 'q = hdqs(2).h(0).h(1)', 'print(q.probabilities(), q.probability_of(\"11\"))'].join('\n'), '[0.25 0.25 0.25 0.25] 0.2499999999999999', [
        'Line 1 imports hdqs.',
        'Line 2 creates a two-qubit register and applies H to qubits 0 and 1.',
        'Line 3 prints the four probabilities, followed by probability_of(\"11\").'
      ], 'All four basis states have probability 0.25. The final value is the floating-point result for the probability of |11⟩, approximately one quarter.') }
      <h3>Displaying Quantum States</h3>
      <p><code>show_state()</code> prints the circuit label and nonzero basis states with their complex amplitudes and probabilities. Unlike <code>sample()</code>, it inspects the ideal simulated state rather than returning repeated measurement counts.</p>
      ${basicCircuitVisual('bellProbabilities')}
      ${example('example-52', 'Example 52 · Amplitudes, not just counts', 'This state display shows both nonzero amplitudes of the Bell state.', ['from sia import hdqs', 'hdqs(2).h(0).cx(0, 1).show_state();'].join('\n'), [
        'H(0)·CX(0,1)',
        'State                 Amplitude       Prob',
        '|00                  0.707+0.000i    50.0%',
        '|11                  0.707+0.000i    50.0%'
      ].join('\n'), [
        'Line 1 imports hdqs.',
        'Line 2 creates two qubits, applies H to qubit 0 and CX from qubit 0 to qubit 1, then show_state() displays the state. The trailing semicolon matches the reference.'
      ], 'The circuit label records H followed by CX. The displayed amplitudes are each 1/√2, giving 50% probability for |00⟩ and |11⟩ and zero for the other basis states.') }
    </section>

    <section class="qubit-section">
      <h2>Phase and Quantum Interference</h2>
      <p>Amplitudes are complex, so a state carries both magnitude and phase. A phase difference may leave immediate computational-basis probabilities unchanged, but later gates can combine amplitudes constructively or destructively. This is why amplitudes contain information that measurement counts alone do not show.</p>
      <h3>Relative Phase</h3>
      <p>The states |+⟩ = (|0⟩ + |1⟩)/√2 and |−⟩ = (|0⟩ − |1⟩)/√2 have the same 50/50 computational-basis probabilities but different relative phases.</p>
      <h3>Phase Gate Example</h3>
      <p>The S gate leaves |0⟩ unchanged and multiplies the |1⟩ amplitude by i. Applied after H, it changes the second amplitude from real to imaginary without changing its magnitude.</p>
      ${example('example-53', 'Example 53 · Phase visible in amplitudes', 'H prepares equal amplitudes and S adds a quarter-turn phase to the |1⟩ component.', ['from sia import hdqs', 'hdqs(1).h(0).s(0).show_state();'].join('\n'), [
        'H(0)·S(0)',
        'State                 Amplitude       Prob',
        '|0                  0.707+0.000i    50.0%',
        '|1                  0.000+0.707i    50.0%'
      ].join('\n'), [
        'Line 1 imports hdqs.',
        'Line 2 creates one qubit, applies H and then S to qubit 0, and displays its state.'
      ], 'The |1⟩ amplitude is 0.707i, while both probabilities remain 50%. The phase is present in the amplitude even though the displayed probabilities are unchanged.') }
      <h3>Hadamard Interference</h3>
      <p>Applying H twice returns |0⟩ because H² = I. At the amplitude level, the two paths to |1⟩ cancel while those to |0⟩ add.</p>
      <div class="state-flow math-flow"><strong>|0⟩</strong><b>→</b><span>H: (|0⟩ + |1⟩)/√2</span><b>→</b><span>H: (|0⟩ + |0⟩ + |1⟩ − |1⟩)/2</span><b>→</b><strong>|0⟩</strong></div>
      ${example('example-56', 'Example 56 · H twice returns to |0⟩', 'The repeated Hadamard gates interfere so the ideal result is deterministic.', ['from sia import hdqs', 'print(hdqs(1).h(0).h(0).sample(100))'].join('\n'), "{'0': 100}", [
        'Line 1 imports hdqs.',
        'Line 2 initializes one qubit, applies H twice to qubit 0, samples 100 measurements, and prints the counts.'
      ], 'All 100 sampled outcomes are 0. The second H reverses the first H, returning the register to |0⟩; this is interference, not a random 50/50 result.') }
      <h3>Understanding Interference Through Measurement</h3>
      <p>Measurement distinguishes the final result after the gates have recombined amplitudes. The S example leaves a balanced distribution at that point, while H followed by H produces only 0. Interference changes the amplitudes before measurement; it does not mean that measurement reveals an unobserved phase directly.</p>
    </section>

    <section class="qubit-section">
      <h2>Sampling and Reproducibility</h2>
      <p>Sampling runs the circuit repeatedly and records classical bit strings. For a state with several possible outcomes, counts vary naturally between unseeded executions. A seed makes the pseudorandom sampling sequence repeatable for the same circuit and shot count.</p>
      <h3>Quantum Circuit Sampling</h3>
      <p><code>sample(n)</code> requests n shots and returns a count for each observed bit string. Counts estimate probabilities; they are not amplitudes and need not equal their expected values exactly.</p>
      <h3>Randomness in Measurement Outcomes</h3>
      <p>The outputs in Examples 46–48 are recorded samples: their exact count splits are illustrative, while the supported outcome patterns follow from the prepared states. H allows 0 or 1; Bell allows 00 or 11; GHZ allows 00000 or 11111.</p>
      <h3>Reproducible Results Using Random Seeds</h3>
      <p>The reference sets <code>seed=42</code> in both runs. Identical circuit construction, seed, and shot count reproduce the displayed count dictionary.</p>
      ${example('example-57', 'Example 57 · Reproducible randomness with a seed', 'Both lines create the same three-qubit superposition with the same seed and request eight samples.', ['from sia import hdqs', 'print(hdqs(3, seed=42).h(0).h(1).h(2).sample(8))', 'print(hdqs(3, seed=42).h(0).h(1).h(2).sample(8))'].join('\n'), [
        "{'110': 4, '011': 1, '101': 1, '000': 1, '111': 1}",
        "{'110': 4, '011': 1, '101': 1, '000': 1, '111': 1}"
      ].join('\n'), [
        'Line 1 imports hdqs.',
        'Lines 2 and 3 each create a three-qubit register with seed 42, apply H to qubits 0, 1, and 2, sample eight outcomes, and print the counts.'
      ], 'The same five bit strings and counts appear twice because the calls use the same seed, circuit, and number of shots. Without the seed, a later sample may have different counts.') }
    </section>

    <section class="qubit-section">
      <h2>Circuit Representation and Plain Commands</h2>
      <p>Sia Script can describe a circuit through a chained Python expression or through plain commands. Circuit labels make a chain readable, while the plain-command tools support text-oriented construction, conversion, and line-specific error reporting.</p>
      <h3>Circuit Labels</h3>
      <p><code>circuit_label()</code> returns a compact label for the operations in the register’s chain.</p>
      ${example('example-58', 'Example 58 · Circuit label in one line', 'The label records gates in application order, including their qubit indices and rotation angle.', ['from sia import hdqs', 'print(hdqs(3).h(0).cx(0, 1).rz(2, 0.5).circuit_label())'].join('\n'), 'H(0)·CX(0,1)·Rz(2,0.5)', [
        'Line 1 imports hdqs.',
        'Line 2 creates three qubits, applies H to qubit 0, CX with control 0 and target 1, and RZ with angle 0.5 on qubit 2, then prints circuit_label().'
      ], 'The output is a readable summary of the three operations in sequence: H(0), CX(0,1), and Rz(2,0.5).') }
      <h3>Writing Circuits Using Plain Commands</h3>
      <p><code>hdqs.plain()</code> accepts commands in a multiline string. The documented example declares two qubits and a seed, applies H and CNOT, requests measurement, and asks to display the state.</p>
      ${example('example-59', 'Example 59 · Plain commands', 'The plain-command form is one command per line and returns a register that can be used to inspect the result.', [
        'from sia import hdqs',
        'q = hdqs.plain(\"\"\"',
        'qubits 2 seed 7',
        'h 0',
        'cnot 0 1',
        '# entangle',
        'measure 1000',
        'state',
        '\"\"\")'
      ].join('\n'), [
        "{'11': 498, '00': 502}",
        'H(0)·CX(0,1)',
        'State                 Amplitude       Prob',
        '|00                  0.707+0.000i    50.0%',
        '|11                  0.707+0.000i    50.0%'
      ].join('\n'), [
        'Line 1 imports hdqs.',
        'Line 2 begins a multiline plain program and stores its returned register as q.',
        'The qubits command creates a two-qubit register and sets seed 7. The h and cnot commands prepare the Bell state; the comment labels that operation.',
        'measure 1000 requests 1,000 measurement shots, and state requests the state display.'
      ], 'The seeded run reports counts 498 for 11 and 502 for 00. The label shows H followed by CX, and the state display shows 50% probability for each Bell component.') }
      <h3>Converting Plain Commands into Sia Script</h3>
      <p><code>plain_code()</code> converts a semicolon-separated plain program into Python Sia Script. The reference also calls <code>plain()</code> on a chain to view its plain-command description.</p>
      ${example('example-60', 'Example 60 · Plain commands and the hdqs chain', 'The first expression converts plain commands to Sia Script; the second renders a chained program as plain commands.', [
        'from sia import hdqs',
        'print(hdqs.plain_code(\"qubits 3; h 0; cnot 0 1; cnot 1 2; rx 2 pi/4; measure 500\"))',
        'hdqs(2).h(0).cnot(0, 1).ry(1, hdqs.PI / 3).plain();'
      ].join('\n'), [
        'from sia import hdqs',
        '',
        'q = hdqs(3).h(0).cnot(0, 1).cnot(1, 2).rx(2, hdqs.PI/4)',
        'print(q.sample(500))',
        '',
        '2 qubits, h 0, cnot 0 1, ry 1 pi/3.'
      ].join('\n'), [
        'Line 1 imports hdqs.',
        'Line 2 passes a plain program string to hdqs.plain_code() and prints the generated Python Sia Script.',
        'Line 3 builds the documented two-qubit gate chain using hdqs.PI / 3, then calls plain() to display its command form.'
      ], 'The first output block is the generated Sia Script for three qubits, H, two CNOTs, RX, and 500 samples. The final line is the plain-command label for the separate two-qubit chain.') }
      <h3>Error Handling and Qubit Index Validation</h3>
      <p>The plain parser checks qubit indices against the declared register. <code>hdqs.PlainError</code> can be caught to present the offending line and a valid range instead of silently accepting an invalid qubit.</p>
      ${example('example-61', 'Example 61 · Invalid qubit index', 'The program declares qubits 0 and 1, then deliberately addresses qubit 5 to demonstrate the parser’s error.', [
        'from sia import hdqs',
        'for lang in (\"en\", \"te\"):',
        '    try:',
        '        hdqs.plain(\"qubits 2\\nh 0\\ncnot 0 5\", lang=lang)',
        '    except hdqs.PlainError as e:',
        '        print(e)'
      ].join('\n'), [
        'line 3: qubit \"5\" does not exist: this program has qubits 0 to 1',
        'పంక్తి 3: క్యూబిట్ "5" లేదు: ఈ ప్రోగ్రామ్‌లో క్యూబిట్‌లు 0 నుండి 1 వరకు ఉన్నాయి.'
      ].join('\n'), [
        'Line 1 imports hdqs.',
        'Line 2 repeats the test in English and Telugu by iterating over the documented language codes.',
        'Lines 3–4 call hdqs.plain() with a two-qubit program whose CNOT target index is invalid; lang selects the error language.',
        'Line 5 catches the documented hdqs.PlainError exception, and line 6 prints its message.'
      ], 'The parser points to line 3 of the plain program, identifies qubit 5 as missing, and states that valid indices are 0 to 1. The second line is the same error in Telugu.') }
    </section>
  </section>`;
}

function circuitLessonTemplate(index) {
  if (index === 0) return basicCircuitsLessonTemplate();
  const pages = [
    ['Introduction to Quantum Circuits', 'A quantum circuit is a left-to-right plan for a quantum computation. It initializes qubits, applies gates, and measures selected qubits. A wire is a qubit, a box is a gate, and M is measurement.', 'q₀: |0⟩ ── H ── M', 'H can prepare an equal superposition from |0⟩; M then returns a classical 0 or 1. Unlike classical circuits, quantum circuits evolve quantum states until measurement. <strong>Key Takeaway:</strong> A circuit organizes qubits, gates, and measurement into an executable computation.'],
    ['Gates in Circuits', 'A gate transforms a state. Gates arranged one after another act sequentially; gates in the same column may act in parallel on independent wires. Multi-qubit gates act on a joint state.', 'q₀: |0⟩ ── H ── X ── M', 'The rule <strong>|ψ′⟩ = U|ψ⟩</strong> means that a unitary matrix U transforms input state |ψ⟩ into output state |ψ′⟩. Here H acts before X. <strong>Key Takeaway:</strong> Gate position records the order of state transformations.'],
    ['Single-Qubit Circuits', 'A single-qubit circuit applies gates to one qubit. X flips |0⟩ and |1⟩; Y flips with phase; Z changes the sign of the |1⟩ component; H changes basis; S and T add relative phase rotations.', 'q₀: |0⟩ ── X ── H ── M', 'The state changes as |0⟩ → |1⟩ → (|0⟩ − |1⟩)/√2. The final minus sign is relative phase: it can influence later interference, even though this measurement has equal probabilities. <strong>Key Takeaway:</strong> Single-qubit circuits control amplitudes and relative phase.'],
    ['Multi-Qubit Circuits', 'A multi-qubit circuit works with joint basis states |00⟩, |01⟩, |10⟩, and |11⟩. CNOT uses a control (●) and target (⊕); it flips the target only when the control is |1⟩.', 'q₀: |0⟩ ── H ── ● ── M<br>                  │<br>q₁: |0⟩ ──────── ⊕ ── M', 'From |00⟩, H then CNOT produces (|00⟩ + |11⟩)/√2, an entangled Bell state. CNOT does not always entangle: on |00⟩ alone it changes nothing. CZ changes the phase of |11⟩; SWAP exchanges wire states. <strong>Key Takeaway:</strong> Multi-qubit gates act on joint states and can create entanglement for suitable inputs.'],
    ['Quantum Circuit Operations', 'Circuits combine sequential, parallel, and controlled operations. Valid gate operations are unitary: they preserve total probability and have inverses.', 'q₀: ── H ── Z ──<br>q₁: ── X ───────', 'For a complete circuit, <strong>|ψ_f⟩ = U_n ... U_2 U_1|ψ_i⟩</strong>; U₁ acts first. For example, H⁻¹ = H and X⁻¹ = X. <strong>Key Takeaway:</strong> Multiple unitary gates compose into one circuit transformation.'],
    ['Measurement & Circuit Results', 'Measurement converts a quantum state into a classical bit string. In the computational basis, a qubit returns 0 or 1 with probabilities determined by its amplitudes.', 'q₀: |0⟩ ── H ── M  →  0 or 1', 'For |ψ⟩ = α|0⟩ + β|1⟩, P(0) = |α|² and P(1) = |β|². A shot is one run; repeated shots give counts, such as {0: 507, 1: 493}, that estimate a probability distribution. <strong>Key Takeaway:</strong> Measurement produces classical data, and repeated shots reveal outcome probabilities.'],
    ['Circuit Execution & Simulation', 'Executing a circuit applies operations in order and collects its outputs. A statevector simulator calculates ideal amplitudes; a shot-based simulator samples measurement outcomes.', 'Circuit → execute → measurements → counts', 'Real quantum hardware also has noise, imperfect gates, limited connectivity, and readout errors. Ideal simulation has none of these; noisy simulation can model them. <strong>Key Takeaway:</strong> Simulation predicts circuit behavior, while hardware executes it physically with errors to consider.'],
    ['Quantum Circuit Examples', 'A bit-flip circuit |0⟩ ── X ── M ideally returns 1. A superposition circuit |0⟩ ── H ── M returns 0 or 1 equally often over many shots.', 'Bell state:<br>q₀: |0⟩ ── H ── ● ── M<br>                  │<br>q₁: |0⟩ ──────── ⊕ ── M', 'The Bell circuit transforms |00⟩ into (|00⟩ + |11⟩)/√2, so its results are 00 or 11. A simple oracle pattern H–Z–H maps |0⟩ to |1⟩ by using phase and interference. <div class="state-flow math-flow"><strong>Qubit</strong><b>→</b><strong>Gate</strong><b>→</b><strong>Circuit</strong><b>→</b><strong>Execution</strong><b>→</b><strong>Measurement</strong><b>→</b><strong>Classical Result</strong></div>Quantum circuits are the building blocks of algorithms such as Deutsch, Deutsch–Jozsa, Bernstein–Vazirani, Simon, and Grover. <strong>Key Takeaway:</strong> Quantum algorithms build problem-solving strategies from circuits that prepare, transform, and measure states.']
  ];
  const [title, definition, diagram, explanation] = pages[index];
  return `<section class="gates-lesson math-lesson circuit-lesson"><div class="qubit-section"><h2>${title}</h2><p>${definition}</p><h3>Example</h3><pre class="circuit-sketch">${diagram}</pre><p>${explanation}</p>${circuitSupplement(index)}${circuitExtension(index)}</div></section>`;
}

function circuitSupplement(index) {
  const notes = [
    '<h3>How to read a circuit</h3><p>Read a circuit from left to right. Each horizontal wire represents one qubit, and the labels at the left show its starting state. A gate changes the state at that moment; a measurement symbol records a classical output at the end.</p><h3>Build a first circuit</h3><p>Start with q₀ in |0⟩. Apply H to create (|0⟩ + |1⟩)/√2, then measure q₀. One run gives either 0 or 1, while many runs approach equal counts. This small circuit separates preparation, transformation, and readout.</p><h3>Width and depth</h3><p>The number of wires is the circuit <strong>width</strong>. The number of time layers is its <strong>depth</strong>. A shallow circuit has fewer opportunities for noise to accumulate, which matters when moving from an ideal diagram to hardware.</p>',
    '<h3>Order changes the answer</h3><p>Gate order is essential. Starting in |0⟩, X then H produces (|0⟩ − |1⟩)/√2, while H then X produces (|0⟩ + |1⟩)/√2. Both have equal measurement probabilities, but their relative phases differ and can lead to different interference later.</p><h3>Sequential and parallel gates</h3><p>Gates on the same wire must be read in sequence. Gates in the same vertical slice can be applied in parallel when they act on different qubits. For example, H on q₀ and X on q₁ may occur together because neither gate needs the other qubit.</p><h3>A useful check</h3><p>Before adding a gate, name its input state and predict its output. Trace one layer at a time instead of treating a whole circuit as a black box. This habit makes it easier to catch reversed controls, missing measurements, and unexpected phase changes.</p>',
    '<h3>Trace one qubit at a time</h3><p>For the circuit |0⟩ → X → H, first X maps |0⟩ to |1⟩. Next H maps |1⟩ to (|0⟩ − |1⟩)/√2. Measuring immediately gives 0 and 1 with equal probability; the minus sign is relative phase, not a negative probability.</p><h3>Amplitude versus probability</h3><p>Gates change complex amplitudes. Probabilities appear only after taking amplitude magnitudes squared at measurement. Therefore Z applied to |+⟩ changes the state to |−⟩ even though both states still give a 50/50 result if measured immediately in the computational basis.</p><h3>Reversing a simple circuit</h3><p>Many common gates undo themselves: X·X = I and H·H = I. Try |0⟩ → H → H: the final state is again |0⟩. Reversible transformations let a circuit temporarily create superposition and later use interference to recover useful information.</p>',
    '<h3>Joint states</h3><p>Two qubits have four computational basis states: |00⟩, |01⟩, |10⟩, and |11⟩. A multi-qubit circuit must describe amplitudes across this joint state space; it cannot always be understood as two separate single-qubit circuits.</p><h3>Creating correlation step by step</h3><p>Begin with |00⟩. Apply H to q₀ to obtain (|00⟩ + |10⟩)/√2. Then apply CNOT with q₀ as control and q₁ as target. The |00⟩ part stays unchanged, while |10⟩ becomes |11⟩, giving the Bell state (|00⟩ + |11⟩)/√2.</p><h3>Control is not measurement</h3><p>A control dot does not read or collapse its qubit. It makes the target operation depend coherently on the control state. This is why a controlled operation can preserve superposition and create entanglement instead of simply making a classical if-statement.</p>',
    '<h3>Composition</h3><p>A circuit is a composition of operations. If U₁ is followed by U₂, the overall transformation is U₂U₁, so the rightmost operation in the algebra acts first. Keeping this convention in mind prevents a common mistake when comparing diagrams with matrices.</p><h3>Controlled and inverse operations</h3><p>Controlled gates apply an operation only on selected components of a joint state. Inverse gates undo a previous transformation: H⁻¹ = H, X⁻¹ = X, and S⁻¹ is written S†. A circuit followed by its exact inverse returns the original ideal state.</p><h3>Compilation before execution</h3><p>A compiler may rewrite a circuit using the gates and qubit connections available on a device. This translation, often called transpilation, should preserve the intended result while aiming for fewer gates, lower depth, or a hardware-compatible layout.</p>',
    '<h3>From amplitudes to outcomes</h3><p>For |ψ⟩ = α|0⟩ + β|1⟩, measurement returns 0 with probability |α|² and 1 with probability |β|². After a computational-basis measurement, the qubit is found in the observed basis state, so measurement is not merely a passive display of a hidden value.</p><h3>Shots and counts</h3><p>A <strong>shot</strong> is one independent execution. If an H gate prepares an ideal equal superposition, 1,000 shots might yield {0: 493, 1: 507}. The counts estimate the distribution; they will not usually be exactly equal because sampling has natural variation.</p><h3>Reading multi-qubit results</h3><p>A measured bit string represents all measured qubits in an order chosen by the tool. Check that ordering before interpreting results. For the Bell circuit, the useful pattern is that only 00 and 11 occur ideally; 01 and 10 signal noise, a setup error, or an incorrect circuit.</p>',
    '<h3>Choose the right kind of simulation</h3><p>A statevector simulator keeps the complete ideal quantum state and is useful for checking amplitudes before measurement. A shot-based simulator instead returns sampled counts, matching the form of an experiment. Both are valuable, but they answer slightly different questions.</p><h3>Execution workflow</h3><p>First define qubits and gates. Next choose measurements and a number of shots. Then execute and inspect either the state, probabilities, or counts. Finally compare the observed pattern with the circuit prediction rather than expecting every individual shot to match one chosen outcome.</p><h3>Why hardware differs</h3><p>Real processors have imperfect gates, readout errors, and limited qubit connectivity. Noisy simulation can model these effects before hardware runs. When results disagree with an ideal simulation, inspect depth, two-qubit gate count, and whether the device required extra routing operations.</p>',
    '<h3>Deterministic bit flip</h3><p>Start with |0⟩, apply X, then measure. X maps |0⟩ to |1⟩, so an ideal result is always 1. This is a good first test because both the state change and the expected counts are simple.</p><h3>Phase becomes visible</h3><p>Consider |0⟩ → H → Z → H → M. H first creates |+⟩; Z changes it to |−⟩; the final H maps |−⟩ to |1⟩. Z alone does not change computational-basis probabilities, but the second H converts its phase change into a definite bit result.</p><h3>Bell-state check</h3><p>Apply H to q₀ and CNOT from q₀ to q₁, then measure both qubits. Repeat the circuit many times. Ideal counts contain 00 and 11 in roughly equal amounts, demonstrating correlation without claiming that either individual measurement was predetermined.</p><h3>From examples to algorithms</h3><p>These patterns recur in larger algorithms: prepare a state, apply transformations that control interference, and measure a result. Deutsch, Bernstein–Vazirani, and Grover-style circuits add more structure, but they are built from the same small operations.</p>'
  ];
  return `<div class="gate-section">${notes[index]}</div>`;
}

function circuitExtension(index) {
  const notes = [
    '<h3>Classical wires alongside quantum wires</h3><p>Most circuits include a classical register as well as qubit wires. A measurement writes a 0 or 1 into that register; later ordinary software can use the recorded value to choose what to display, repeat, or analyze.</p><h3>Try this prediction</h3><p>Compare |0⟩ → H → M with |0⟩ → X → H → M. Predict the probabilities before running either circuit. Both are balanced, but their states are not identical—a useful reminder that measurement statistics do not reveal every detail of a quantum state.</p>',
    '<h3>Gate labels are instructions</h3><p>A label such as H, X, or RZ(θ) identifies the exact operation at that location. A control line joins operations that must act together. Reading these symbols carefully is more reliable than guessing an operation from the appearance of a circuit.</p><h3>Layer-by-layer example</h3><p>For two qubits initialized as |00⟩, an H on q₀ and X on q₁ in the same layer gives (|01⟩ + |11⟩)/√2. A later CNOT can then act on that joint state. Write down the state after each layer to make the sequence clear.</p>',
    '<h3>Changing the measurement basis</h3><p>A circuit can measure information about a different basis by applying gates before a standard computational-basis measurement. For example, H followed by measurement distinguishes the |+⟩ and |−⟩ states: H maps them to |0⟩ and |1⟩ respectively.</p><h3>Small debugging exercise</h3><p>When a result is surprising, remove gates until the circuit has one operation, check its expected state, then add operations back one at a time. On a simulator, inspecting the state before measurement helps distinguish an amplitude error from a readout expectation.</p>',
    '<h3>More than one controlled gate</h3><p>Controlled-Z changes only the phase of the |11⟩ component, while SWAP exchanges the states carried by two wires. A Toffoli gate uses two controls and flips its target only when both controls are |1⟩. These gates express relationships that one-qubit gates cannot create alone.</p><h3>When is a state entangled?</h3><p>The Bell state cannot be factored into one state for q₀ multiplied by one state for q₁, so it is entangled. By contrast, applying H independently to both qubits produces a product of two superpositions: it has several possible outcomes but no Bell-style entanglement.</p>',
    '<h3>Identity operations and simplification</h3><p>Some neighboring operations can cancel. Since H followed by H is the identity, that pair can be removed without changing an ideal circuit. Simplifying in this way can make a diagram easier to understand and reduce the number of operations sent to hardware.</p><h3>Operations versus measurements</h3><p>Gate operations in the middle of a quantum circuit are designed to be reversible. Measurement is different: it creates a classical record and generally prevents the original superposition from being recovered. Plan measurements at the point where classical information is actually needed.</p>',
    '<h3>Probabilities are estimates</h3><p>Counts divided by shots give estimated probabilities. If 80 of 100 shots return 1, the estimate is 0.80, but another set of 100 shots will usually differ slightly. More shots reduce this sampling uncertainty, although they do not remove hardware noise.</p><h3>Results need context</h3><p>Always record the number of shots, measurement basis, bit ordering, and whether the run used an ideal simulator, noisy simulator, or hardware. Those details turn a list of counts into a result another learner can correctly interpret and reproduce.</p>',
    '<h3>State inspection before sampling</h3><p>In an ideal simulator, inspect the statevector before measurement to verify the intended amplitudes. Then run shots to see sampled outcomes. This two-step approach connects the mathematical state to the counts a real experiment would return.</p><h3>Fair comparisons</h3><p>When comparing runs, keep the circuit, shot count, and measurement setup fixed. Change one thing at a time—such as adding a noise model or compiling for a different device—so that a difference in results has a clear possible cause.</p>',
    '<h3>How to test an example</h3><p>For every circuit, state an expected pattern before executing it. The X example should always produce 1 ideally; the H example should approach equal counts; the Bell example should show correlated pairs. Predictions make examples active experiments rather than diagrams to memorize.</p><h3>Combine familiar patterns</h3><p>A useful next exercise is to prepare a Bell state, apply another CNOT, and reason through the result layer by layer. Small variations like this build confidence with controls, phase, and measurement before moving to full algorithms.</p>'
  ];
  return `<div class="gate-section">${notes[index]}</div>`;
}

function circuitStudyLessonTemplate(topic) {
  const sections = topic.sections.map(([title, content]) => `<section class="qubit-section"><h2>${title}</h2><p>${content}</p></section>`).join('');
  return `<section class="qubit-lesson circuit-study-lesson">${sections}</section>`;
}

function currentCircuitsAndGatesTopic() {
  if (state.activeChapter === 2 && state.activeGatePage === 'introduction') return 1;
  if (state.activeChapter !== 3) return -1;
  if (state.activeCircuitStudyTopic >= 0) return state.activeCircuitStudyTopic + 2;
  return state.activeCircuitTopic === 0 ? 0 : -1;
}

function loadCircuitsAndGatesTopic(topicIndex) {
  const route = circuitsAndGatesTopics[topicIndex]?.route;
  if (!route) return;
  if (route.group === 'circuit') loadCircuitTopic(route.index);
  else if (route.group === 'gate') loadGatePage(route.page);
  else if (route.group === 'circuit-study') loadCircuitStudyTopic(route.index);
}

function loadCircuitTopic(topicIndex, updateHash = true) {
  state.activeChapter = 3;
  state.activeCircuitStudyTopic = -1;
  state.activeCircuitTopic = Math.max(0, Math.min(circuitTopics.length - 1, topicIndex));
  state.circuitsExpanded = true;
  const topic = circuitTopics[state.activeCircuitTopic];
  const isPrimaryTopic = state.activeCircuitTopic === 0;
  const isLast = state.activeCircuitTopic === circuitTopics.length - 1;
  if (updateHash) window.location.hash = `circuit-${state.activeCircuitTopic + 1}`;
  $('#lesson-number').textContent = '04';
  $('#lesson-category').textContent = 'QUANTUM CIRCUITS';
  $('#lesson-title').textContent = topic.title;
  $('#lesson-intro').textContent = topic.intro;
  $('#lesson-type').textContent = chapters[3].type;
  $('#next-number').textContent = isPrimaryTopic ? '03' : '04';
  $('#next-title').textContent = isPrimaryTopic ? circuitsAndGatesTopics[1].title : isLast ? chapters[4].title : circuitTopics[state.activeCircuitTopic + 1].title;
  $('#next-time').textContent = isLast ? chapters[4].time : '6 min read';
  $('#previous-title').textContent = isPrimaryTopic ? gatePageInfo.circuits[0] : circuitTopics[state.activeCircuitTopic - 1]?.title || gatePageInfo.circuits[0];
  $('#footer-next-title').textContent = $('#next-title').textContent;
  $('#previous-button').disabled = false;
  $('#next-button').disabled = false;
  $('#next-button small').textContent = isLast ? 'Next chapter' : 'Next topic';
  $('#lesson-body').innerHTML = circuitLessonTemplate(state.activeCircuitTopic);
  if (isPrimaryTopic) addLessonSupport('circuit-intro');
  $('#mobile-breadcrumb').innerHTML = `Chapter 04 <span>/</span> ${topic.title}`;
  $('#doc-breadcrumb').innerHTML = `Quantum Circuits <span>/</span> ${topic.title}`;
  renderSidebar();
  renderContents();
  wireInteractions(3);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.innerWidth <= 900) $('#sidebar').classList.remove('open');
}

function loadCircuitStudyTopic(topicIndex, updateHash = true) {
  state.activeChapter = 3;
  state.activeCircuitTopic = 0;
  state.activeCircuitStudyTopic = Math.max(0, Math.min(circuitStudyTopics.length - 1, topicIndex));
  state.circuitsExpanded = true;
  const topic = circuitStudyTopics[state.activeCircuitStudyTopic];
  const sequenceIndex = state.activeCircuitStudyTopic + 2;
  if (updateHash) window.location.hash = `circuit-guide-${state.activeCircuitStudyTopic + 1}`;
  $('#lesson-number').textContent = '04';
  $('#lesson-category').textContent = 'QUANTUM CIRCUITS AND GATES';
  $('#lesson-title').textContent = topic.title;
  $('#lesson-intro').textContent = topic.intro;
  $('#lesson-type').textContent = chapters[3].type;
  $('#next-number').textContent = sequenceIndex === circuitsAndGatesTopics.length - 1 ? '05' : `04.${sequenceIndex + 1}`;
  $('#next-title').textContent = sequenceIndex === circuitsAndGatesTopics.length - 1 ? chapters[4].title : circuitsAndGatesTopics[sequenceIndex + 1].title;
  $('#next-time').textContent = sequenceIndex === circuitsAndGatesTopics.length - 1 ? chapters[4].time : '6 min read';
  $('#previous-title').textContent = circuitsAndGatesTopics[sequenceIndex - 1].title;
  $('#footer-next-title').textContent = $('#next-title').textContent;
  $('#previous-button').disabled = false;
  $('#next-button').disabled = false;
  $('#next-button small').textContent = sequenceIndex === circuitsAndGatesTopics.length - 1 ? 'Next chapter' : 'Next topic';
  $('#lesson-body').innerHTML = circuitStudyLessonTemplate(topic);
  $('#mobile-breadcrumb').innerHTML = `Chapter 04 <span>/</span> ${topic.title}`;
  $('#doc-breadcrumb').innerHTML = `Quantum Circuits and Gates <span>/</span> ${topic.title}`;
  renderSidebar();
  renderContents();
  wireInteractions(3);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.innerWidth <= 900) $('#sidebar').classList.remove('open');
}

function algorithmLessonTemplate(topic) {
  if (topic.title === 'Deutsch Algorithm') return `<section class="qubit-lesson algorithm-lesson">
    <div class="qubit-section"><h2>What is the Deutsch Algorithm?</h2><p>The Deutsch Algorithm answers one specific question about a one-bit function f(x): are its two outputs the same, or are they different? It introduces a central quantum-computing idea: an oracle can place information into phase, and interference can reveal a property of a function without reading each output one at a time.</p><p>The problem comes with a promise: f is either constant or balanced. That promise makes the final measurement meaningful.</p></div>
    <div class="qubit-section"><h2>Constant and balanced functions</h2><p>For one input bit there are only two inputs, 0 and 1. <strong>Constant</strong> means f(0) = f(1). <strong>Balanced</strong> means f(0) ≠ f(1).</p><div class="gate-comparison"><div><strong>Function type</strong><strong>f(0)</strong><strong>f(1)</strong></div><div><span>Constant: always 0</span><span>0</span><span>0</span></div><div><span>Constant: always 1</span><span>1</span><span>1</span></div><div><span>Balanced: f(x) = x</span><span>0</span><span>1</span></div><div><span>Balanced: f(x) = 1 - x</span><span>1</span><span>0</span></div></div><p>The implementation below uses the balanced function f(x) = x. Its oracle is a CNOT: when the input qubit is 1, it flips the auxiliary qubit.</p></div>
    <div class="qubit-section"><h2>Classical approach vs quantum approach</h2><div class="comparison-grid"><div><strong>Classical</strong><span>Evaluate f(0) and f(1), then compare the two answers. In the worst case, two oracle queries are needed.</span></div><div><strong>Quantum</strong><span>Prepare both inputs as amplitudes, call the promised oracle once, and use interference to identify the type.</span></div></div><p>This is a query-complexity advantage for the promised problem. It does not mean a quantum computer prints both values of f, or that every practical problem receives the same kind of speed-up.</p></div>
    <div class="qubit-section"><h2>The intuition: phase becomes an answer</h2><p>After the first Hadamard gates, the input qubit has amplitude for 0 and 1, while the auxiliary qubit is prepared in the minus state (|0&gt; - |1&gt;) / sqrt(2). The oracle U<sub>f</sub>|x,y&gt; = |x, y XOR f(x)&gt; then writes f(x) into the input branch's relative phase: (-1)<sup>f(x)</sup>.</p><p>If f(0) and f(1) agree, the two input branches have matching phase; the final H makes them interfere at measurement 0. If they differ, one branch has an opposite phase; the final H makes them interfere at measurement 1. That controlled interference is the algorithm's quantum advantage.</p></div>
    <div class="qubit-section"><h2>Circuit walkthrough</h2><ol><li><strong>Create 2 qubits:</strong> the input and auxiliary qubits both start in |0&gt;.</li><li><strong>Apply X to qubit 1:</strong> this prepares |1&gt;.</li><li><strong>Apply H gates:</strong> they create the superposition used by the algorithm.</li><li><strong>Apply CNOT(0,1):</strong> this is the balanced oracle for f(x) = x.</li><li><strong>Apply the final H to qubit 0:</strong> interference converts the relative phase into the answer bit.</li><li><strong>Display the state and measure the circuit:</strong> an input-qubit value of 1 indicates a balanced function.</li></ol><div class="circuit-sketch"><div>q0: |0&gt; -- H -- ● -- H -- M</div><div>q1: |0&gt; -- X -- H -- ⊕ ------</div></div></div>
    <div class="qubit-section"><h2>Complete Sia HDQS implementation</h2><p>This circuit uses superposition, a balanced oracle, and interference to determine the function type with one quantum oracle evaluation.</p><pre class="hdqs-code"><code>from sia import HDQS

q = HDQS(2)

# Prepare |1>
q.x(1)

# Superposition
q.h(0)
q.h(1)

# Oracle: balanced function
q.cnot(0, 1)

# Final Hadamard
q.h(0)

print("State:")
q.show_state()

print("Measurement:")
print(q.measure())</code></pre></div>
    <div class="qubit-section"><h2>How the circuit works</h2><ol><li><strong>Create 2 qubits:</strong> qubit 0 is the input qubit and qubit 1 is the auxiliary qubit.</li><li><strong>Apply X to qubit 1:</strong> this prepares |1&gt;.</li><li><strong>Apply H gates:</strong> Hadamard gates create the superposition used by the algorithm.</li><li><strong>Apply CNOT(0,1):</strong> this is the balanced oracle.</li><li><strong>Apply the final H to qubit 0:</strong> interference turns the oracle information into the input-qubit result.</li><li><strong>Display the state and measure:</strong> a final input-qubit value of <strong>1</strong> indicates a balanced function.</li></ol></div>
    <div class="qubit-section"><h2>Output explanation</h2><pre class="hdqs-output"><code>State:
X(1)·H(0)·H(1)·CNOT(0,1)·H(0)
State             Amplitude     Prob
─────────────────────────────────────
|10⟩           0.707+0.000i    50.0%
|11⟩          -0.707+0.000i    50.0%

Measurement:
11</code></pre><p>|10⟩ and |11⟩ each have a 50% probability. Their amplitudes show the phase difference created by the circuit. The final measurement is 11; the first, input qubit is <strong>1</strong>, which indicates that the implemented oracle is <strong>balanced</strong>.</p></div>
    <aside class="key-idea"><span class="card-label">Key Takeaway</span><p>Deutsch Algorithm demonstrates how quantum superposition and interference can determine whether a one-bit Boolean function is constant or balanced.</p></aside>
  </section>`;
  if (topic.title === 'Deutsch-Jozsa Algorithm') return `<section class="qubit-lesson algorithm-lesson">
    <div class="qubit-section"><h2>What is the Deutsch–Jozsa Algorithm?</h2><p>Deutsch–Jozsa extends Deutsch's question to a function of many input bits. It decides a global property of a promised Boolean function: is it constant or balanced? It matters because a quantum oracle can encode information about all input branches at once, and interference can reveal that property with one oracle query.</p></div>
    <div class="qubit-section"><h2>Problem statement: constant vs balanced</h2><p>For n input bits, f maps 2<sup>n</sup> input strings to 0 or 1. The promise is that it is either constant—the same output for every string—or balanced—0 for exactly half of the strings and 1 for the other half. This example has two input qubits, so its inputs are 00, 01, 10, and 11.</p><div class="gate-comparison"><div><strong>Example function</strong><strong>Outputs</strong><strong>Type</strong></div><div><span>f(x) = 0</span><span>0, 0, 0, 0</span><span>Constant</span></div><div><span>f(x) = 1</span><span>1, 1, 1, 1</span><span>Constant</span></div><div><span>f(x) = x<sub>0</sub> XOR x<sub>1</sub></span><span>0, 1, 1, 0</span><span>Balanced</span></div></div></div>
    <div class="qubit-section"><h2>Classical vs quantum approach</h2><div class="comparison-grid"><div><strong>Classical approach</strong><span>Query inputs one at a time. Under the promise, a deterministic method may need more than half of all inputs before it can rule out the other case.</span></div><div><strong>Quantum approach</strong><span>Prepare all input strings as amplitudes, query the oracle once, and use a final Hadamard layer to expose the global pattern.</span></div></div><p>This is an oracle-query advantage for a promised problem, and a clear demonstration of how interference can be used to compute a property rather than list all outputs.</p></div>
    <div class="qubit-section"><h2>Quantum intuition and circuit flow</h2><p>q0 and q1 are input qubits; q2 is the ancilla. X prepares the ancilla in |1&gt;. The first H gates put the inputs into an equal superposition and turn the ancilla into |-&gt;. The oracle writes function information into relative phase. Final H gates cause matching phases to collect at 00 for a constant function, while a balanced oracle leaves a non-zero input result.</p><div class="circuit-sketch"><div>q0: |0&gt; -- H -- ● -------- H -- M</div><div>q1: |0&gt; -- H -- ┼ -- ● ---- H -- M</div><div>q2: |0&gt; -- X -- H -- ⊕ -- ⊕ ------</div></div></div>
    <div class="qubit-section"><h2>Step-by-step circuit explanation</h2><ol><li><strong>Create three qubits:</strong> q0 and q1 are the two-bit input; q2 is the ancilla.</li><li><strong>X on q2:</strong> changes the ancilla from |0&gt; to |1&gt;.</li><li><strong>H on q0 and q1:</strong> creates equal amplitude for all four input strings. <strong>H on q2</strong> turns |1&gt; into |-&gt;.</li><li><strong>CNOT(0, 2) and CNOT(1, 2):</strong> together implement f(x) = x<sub>0</sub> XOR x<sub>1</sub>, a balanced function.</li><li><strong>Final H on q0 and q1:</strong> turns the oracle phase pattern into a readable input bit string.</li><li><strong>Measure q0 and q1:</strong> 00 means constant; any non-zero result means balanced under the promise.</li></ol></div>
    <div class="qubit-section"><h2>Sia HDQS implementation</h2><pre class="hdqs-code"><code>from sia import HDQS

q = HDQS(3)

q.x(2)

q.h(0)
q.h(1)
q.h(2)

q.cnot(0, 2)
q.cnot(1, 2)

q.h(0)
q.h(1)

print("Deutsch–Jozsa Final State:")
q.show_state()

result = q.measure()

print("\nMeasurement Result:", result)

if result == "00":
    print("Function is CONSTANT")
else:
    print("Function is BALANCED")</code></pre></div>
    <div class="qubit-section"><h2>How it works</h2><p>Deutsch–Jozsa determines whether a promised Boolean function is constant or balanced. A constant function gives the same output for every input; a balanced function gives 0 for half of its inputs and 1 for the other half. Superposition, the oracle, and interference let the circuit classify that property with one oracle evaluation.</p><p>Here f(x) = x<sub>0</sub> XOR x<sub>1</sub>, so the two CNOT gates form a balanced oracle.</p></div>
    <div class="qubit-section"><h2>Circuit steps</h2><ol><li><strong>Prepare the ancilla:</strong> X on qubit 2 changes it to |1&gt;.</li><li><strong>Create Hadamard superposition:</strong> H gates prepare the inputs and ancilla for the oracle.</li><li><strong>Apply the balanced oracle:</strong> CNOT(0,2) and CNOT(1,2) implement f(x) = x<sub>0</sub> XOR x<sub>1</sub>.</li><li><strong>Apply final Hadamards:</strong> H on the input qubits lets the oracle phases interfere.</li><li><strong>Measure:</strong> 00 means constant; any other input result means balanced.</li></ol></div>
    <div class="qubit-section"><h2>Output explanation</h2><pre class="hdqs-output"><code>Deutsch–Jozsa Final State:
X(2)·H(0)·H(1)·H(2)·CNOT(0,2)·CNOT(1,2)·H(0)·H(1)
State             Amplitude     Prob
─────────────────────────────────────
|110⟩          0.707+0.000i    50.0%
|111⟩         -0.707+0.000i    50.0%

Measurement Result: 110
Function is BALANCED</code></pre><p>|110⟩ and |111⟩ each have a 50% probability. The measured result is 110, which is not 00; therefore the function is <strong>BALANCED</strong>.</p></div>
    <aside class="key-idea"><span class="card-label">Key Takeaway</span><p>Deutsch–Jozsa uses quantum superposition and interference to classify a promised function as constant or balanced with one oracle evaluation.</p></aside>
  </section>`;
  if (topic.title === 'Bernstein-Vazirani Algorithm') return `<section class="qubit-lesson algorithm-lesson">
    <div class="qubit-section"><h2>What is Bernstein–Vazirani?</h2><p>Bernstein–Vazirani is a quantum algorithm for recovering a hidden bit string. An oracle has a secret string s, and its output depends on the parity of the bits selected by s. The goal is to learn every bit of s.</p><p>It is useful because it isolates a powerful quantum idea: one carefully prepared oracle call can encode all bits of a hidden string into phase, and Hadamard interference can recover those bits together.</p></div>
    <div class="qubit-section"><h2>Problem statement: the hidden secret string</h2><p>Let the hidden string be s = 101. The oracle computes f(x) = s · x mod 2: multiply matching bits, add them modulo 2, and return one bit. For example, the first and third input positions matter because those are the positions where s has a 1.</p><div class="gate-comparison"><div><strong>Input x</strong><strong>f(x) for s = 101</strong><strong>Reason</strong></div><div><span>000</span><span>0</span><span>No selected input bit is 1</span></div><div><span>001</span><span>1</span><span>Third selected bit is 1</span></div><div><span>100</span><span>1</span><span>First selected bit is 1</span></div><div><span>101</span><span>0</span><span>1 XOR 1 = 0</span></div></div></div>
    <div class="qubit-section"><h2>Classical vs quantum approach</h2><div class="comparison-grid"><div><strong>Classical</strong><span>Query carefully chosen inputs to discover which positions affect the parity. For an n-bit secret, this takes n oracle queries in the standard deterministic approach.</span></div><div><strong>Quantum</strong><span>Prepare all input positions in superposition, make one oracle query, then measure all n input qubits to recover the complete string.</span></div></div><p>For this three-bit example, the classical approach needs three informative queries; the Bernstein–Vazirani circuit uses one oracle call.</p></div>
    <div class="qubit-section"><h2>Quantum intuition and circuit flow</h2><p>The first three qubits form the input register. One extra ancilla qubit begins in |0&gt;, becomes |1&gt; after X, and becomes |-&gt; after H. The input H gates prepare every three-bit input as an amplitude. CNOT gates at the secret's 1 positions encode that secret as phase. The final H gates convert the phase pattern into the measurable bit string 101.</p><div class="circuit-sketch"><div>q0: |0&gt; -- H -- ● -- H -- M</div><div>q1: |0&gt; -- H -------- H -- M</div><div>q2: |0&gt; -- H -- ● -- H -- M</div><div>q3: |0&gt; -- X -- H -- ⊕ -- ⊕</div></div></div>
    <div class="qubit-section"><h2>Step-by-step execution</h2><ol><li><strong>Create n + 1 qubits:</strong> three input qubits for 101 and one ancilla.</li><li><strong>Prepare superposition:</strong> X puts the ancilla in |1&gt;, then H acts on every qubit. The inputs become an equal superposition and the ancilla becomes |-&gt;.</li><li><strong>Encode the oracle:</strong> the loop adds CNOTs only where hidden_string has 1. For 101, that creates CNOT(0, 3) and CNOT(2, 3); no CNOT is added for position 1.</li><li><strong>Interfere:</strong> final H gates on the inputs turn their relative phases into the basis state |101&gt;.</li><li><strong>Measure:</strong> sort results by qubit index, join their string values, and compare the measured string with the hidden one.</li></ol></div>
    <div class="qubit-section"><h2>Sia HDQS implementation</h2><pre class="hdqs-code"><code>from collections import Counter
from sia import HDQS

def top_bitstring(samples):
    if isinstance(samples, dict):
        return str(max(samples, key=samples.get))
    if isinstance(samples, str):
        return samples
    return str(Counter(map(str, samples)).most_common(1)[0][0])

def qubit0_is_leftmost():
    t = HDQS(2, use_gpu=False)
    t.x(0)
    return top_bitstring(t.sample(1)) == "10"

def bernstein_vazirani(hidden):
    n = len(hidden)
    q = HDQS(n + 1, use_gpu=False)

    q.x(n)
    for i in range(n + 1):
        q.h(i)
    for i, bit in enumerate(hidden):
        if bit == "1":
            q.cnot(i, n)
    for i in range(n):
        q.h(i)

    key = top_bitstring(q.sample(100))
    return key[:n] if qubit0_is_leftmost() else key[::-1][:n]

if __name__ == "__main__":
    hidden = "101"
    measured = bernstein_vazirani(hidden)
    print(f"Hidden: {hidden} | Measured: {measured} -> "
          f"{'SUCCESS' if measured == hidden else 'MISMATCH'}")</code></pre></div>
    <div class="qubit-section"><h2>How it works</h2><p>Bernstein–Vazirani finds a hidden binary string using one quantum oracle query. In this example the hidden string is 101.</p><ol><li><strong>Prepare the ancilla:</strong> place the final qubit in |1&gt;.</li><li><strong>Create superposition:</strong> apply Hadamard gates to all qubits.</li><li><strong>Encode the hidden string:</strong> the oracle uses CNOT gates for each 1 bit. For 101, CNOT is applied for the first and third bits.</li><li><strong>Apply final Hadamards:</strong> interference maps the encoded phase to the input register.</li><li><strong>Measure the input qubits:</strong> the result 101 matches the hidden string, so the algorithm succeeds.</li></ol></div>
    <div class="qubit-section"><h2>Output explanation</h2><pre class="hdqs-output"><code>Hidden: 101 | Measured: 101 -> SUCCESS</code></pre><p>The hidden string is 101, and HDQS measures 101. Since both strings match, the algorithm successfully recovered the hidden string.</p></div>
    <aside class="key-idea"><span class="card-label">Key Takeaway</span><p>Bernstein–Vazirani demonstrates how quantum superposition and interference can identify a hidden binary string using a single oracle query.</p></aside>
  </section>`;
  if (topic.title === "Simon's Algorithm") return `<section class="qubit-lesson algorithm-lesson">
<div class="qubit-section"><h2>What is Simon's Algorithm?</h2><p>Simon's Algorithm finds a hidden binary string, or secret, s in a function that satisfies f(x) = f(x XOR s). The function has a hidden periodicity: pairs of inputs separated by s produce the same output. The goal is to discover that secret. In this example, the secret is <strong>s = 11</strong>.</p></div>
<div class="qubit-section"><h2>How Simon's Algorithm works</h2><ol><li><strong>Prepare the input qubits in superposition:</strong> Hadamard gates let the circuit consider multiple input values together.</li><li><strong>Apply the Simon oracle:</strong> it encodes the hidden periodicity.</li><li><strong>Apply Hadamard gates again:</strong> interference turns the oracle information into useful measurement patterns.</li><li><strong>Measure the circuit:</strong> read the input-side values from the results.</li><li><strong>Form equations:</strong> each valid input measurement y satisfies y · s = 0 (mod 2).</li></ol><p>Simon's measurements do not directly return the secret string. Instead, multiple valid measurements provide equations that can be used to determine the hidden secret.</p></div>
<div class="qubit-section"><h2>Sia HDQS code</h2><pre class="hdqs-code"><code>from collections import Counter
from sia import HDQS


def top_bitstrings(samples):
    if isinstance(samples, dict):
        return samples
    return Counter(map(str, samples))


# Simon's secret string
secret = "11"

# 2 input qubits + 2 output qubits
q = HDQS(4, use_gpu=False)

# Create superposition on input qubits
q.h(0)
q.h(1)

# Oracle for f(x) = f(x XOR 11)
# For secret 11, output qubits depend on both input qubits
q.cnot(0, 2)
q.cnot(1, 2)
q.cnot(0, 3)
q.cnot(1, 3)

# Apply Hadamard to input qubits
q.h(0)
q.h(1)

# Sample the circuit
samples = q.sample(100)

print("Simon Algorithm Samples:")
print(top_bitstrings(samples))</code></pre></div>
<div class="qubit-section"><h2>Expected output</h2><pre class="hdqs-output"><code>Simon Algorithm Samples:
{'0000': 26, '1111': 26, '1100': 28, '0011': 20}</code></pre><p>These counts are measurement frequencies from 100 samples: 0000 appears 26 times, 1111 appears 26 times, 1100 appears 28 times, and 0011 appears 20 times. Total = 100 samples.</p></div>
<div class="qubit-section"><h2>Explain the output</h2><div class="gate-comparison"><div><strong>Measured state</strong><strong>Input part</strong><strong>Output part</strong></div><div><span>0000</span><span>00</span><span>00</span></div><div><span>1111</span><span>11</span><span>11</span></div><div><span>1100</span><span>11</span><span>00</span></div><div><span>0011</span><span>00</span><span>11</span></div></div><p>The first two bits are the important input-side measurement results. For the hidden secret s = 11, 00 · 11 = 0 (mod 2), and 11 · 11 = 2 = 0 (mod 2). Therefore both observed input values, 00 and 11, satisfy Simon's condition. The state 1111 is a measurement result, not the secret; the hidden secret is s = 11.</p></div>
<div class="qubit-section"><h2>Simon vs other algorithms</h2><div class="comparison-grid"><div><strong>Deutsch</strong><span>Is the function constant or balanced?</span></div><div><strong>Deutsch–Jozsa</strong><span>Is the multi-input function constant or balanced?</span></div><div><strong>Bernstein–Vazirani</strong><span>What is the hidden string?</span></div><div><strong>Simon</strong><span>What is the hidden periodicity or secret?</span></div><div><strong>Grover</strong><span>Where is the target?</span></div></div></div>
<aside class="key-idea"><span class="card-label">Key Takeaway</span><p>Simon's Algorithm uses quantum interference to reveal information about a hidden periodicity. The measurements produce equations satisfying y · s = 0 (mod 2), which can be combined to determine the hidden secret.</p></aside></section>`;
/* Previous Simon lesson content retained as an inactive source comment.
<div class="qubit-section"><h2>What is Simon’s Algorithm?</h2><p>Simon’s Algorithm finds a hidden non-zero bit string s in a promised function where f(x) = f(x XOR s). Every output has exactly two matching inputs, separated by the same hidden XOR mask s. It is an early example of a quantum algorithm that exposes hidden structure rather than searching for one marked item.</p></div>
<div class="qubit-section"><h2>Why we need it and the problem it solves</h2><p>The task is to recover s without listing the complete function table. Classically, finding enough matching output pairs can require exponentially many queries. Quantumly, a superposition query and measurement create equations of the form y · s = 0 mod 2; enough independent equations reveal s with ordinary binary linear algebra.</p><div class="gate-comparison"><div><strong>Approach</strong><strong>Oracle information</strong><strong>Result</strong></div><div><span>Classical</span><span>Query inputs until matching outputs reveal pairs</span><span>Can require exponentially many queries</span></div><div><span>Quantum</span><span>Use interference to sample equations y · s = 0</span><span>Solve the collected equations classically</span></div></div></div>
<div class="qubit-section"><h2>Core intuition, terms, and circuit flow</h2><p><strong>XOR</strong> means bitwise addition modulo 2. The <strong>secret string</strong> is s. The <strong>oracle</strong> implements the promised function. The input register begins in an equal superposition; after the oracle, measuring the output register leaves the input register in a superposition of two values x and x XOR s. A final Hadamard layer produces a bit string y satisfying y · s = 0 mod 2.</p><ol><li>Prepare an input register and output register in |0...0&gt;.</li><li>Apply H to every input qubit and call the oracle.</li><li>Measure or discard the output register; this leaves a hidden pair in the input register.</li><li>Apply H to the input register and measure y.</li><li>Repeat, collect independent equations, and solve for s over mod-2 arithmetic.</li></ol></div>
<div class="qubit-section"><h2>Why measured equations reveal the secret</h2><p>For each sample y, the algorithm guarantees y · s = 0 mod 2. If s = 101, examples of valid equations include y = 010, because 0·1 XOR 1·0 XOR 0·1 = 0. Independent samples constrain the unknown bits of s until only the promised non-zero secret remains. A single measurement normally does not reveal s by itself.</p></div>
<div class="qubit-section"><h2>Sia-Script / HDQS implementation and output</h2><p>The supplied <code>sia_hdqs_algorithms.ipynb</code> contains no Simon’s Algorithm code cell and no Simon output. To avoid inventing unsupported HDQS operations, this page does not display substitute code or a fabricated result. When the project’s Simon cell is added, it should use its exact HDQS code here and document the returned equations before solving them.</p></div>
<div class="qubit-section"><h2>Google Colab workflow</h2><ol><li>Install the project’s pinned Sia-Script version: <code>!pip install -q sia-script==0.6.5</code>.</li><li>Set the notebook’s BASE_URL and API_KEY configuration.</li><li>Run the supplied Simon cell repeatedly to collect independent y samples.</li><li>Solve y · s = 0 mod 2 classically and verify f(x) = f(x XOR s).</li></ol></div>
<aside class="key-idea"><span class="card-label">Key Takeaways</span><ul><li>Simon’s promise is f(x) = f(x XOR s).</li><li>Quantum interference produces equations about s, not the full truth table.</li><li>Several independent measurements plus classical mod-2 linear algebra recover the secret.</li></ul></aside></section>`;
*/
  if (topic.title === "Grover's Algorithm") return `<section class="qubit-lesson algorithm-lesson">
<div class="qubit-section"><h2>What is Grover's Algorithm?</h2><p>Grover's Algorithm searches an unstructured set for a marked item. The circuit uses an oracle to identify the target state, then uses diffusion to make that target more likely to appear when measured. In this three-qubit SIA + HDQS example, the target state is <strong>|111&gt;</strong>.</p></div>
<div class="qubit-section"><h2>How Grover's Algorithm works</h2><ol><li><strong>Create the three-qubit circuit:</strong> <code>HDQS(3)</code> creates the circuit for the eight possible three-bit states.</li><li><strong>Prepare superposition:</strong> H gates create equal amplitude for every state from 000 through 111.</li><li><strong>Apply the oracle and phase marking:</strong> the oracle marks <strong>|111&gt;</strong> by changing its phase. Its Toffoli/CCNOT is decomposed into H, CNOT, and RZ gates; it is not a native CZ or native CCNOT gate.</li><li><strong>Apply diffusion and amplitude amplification:</strong> H → X → decomposed Toffoli → X → H reflects the amplitudes about their average, increasing the amplitude of the marked state.</li><li><strong>Measure the circuit:</strong> 25 shots collect a measurement distribution, where 111 is expected to be the most frequent result.</li></ol><p>Grover's flow is <strong>Superposition → Oracle/Phase Marking → Diffusion → Amplitude Amplification → Measurement</strong>. The oracle marks |111&gt;, diffusion amplifies its amplitude, and measurement is therefore more likely to return 111.</p></div>
<div class="qubit-section"><h2>Sia HDQS code</h2><pre class="hdqs-code"><code>from collections import Counter
from math import pi
from sia import HDQS

def toffoli_decomposed(q, c1, c2, t):
    q.h(t)
    q.cnot(c2, t)
    q.rz(t, -pi / 4)
    q.cnot(c1, t)
    q.rz(t, pi / 4)
    q.cnot(c2, t)
    q.rz(t, -pi / 4)
    q.cnot(c1, t)
    q.rz(c2, pi / 4)
    q.rz(t, pi / 4)
    q.h(t)
    q.cnot(c1, c2)
    q.rz(c1, pi / 4)
    q.rz(c2, -pi / 4)
    q.cnot(c1, c2)

q = HDQS(3)

# Superposition over all 8 states
for qubit in range(3):
    q.h(qubit)

# Oracle: phase-mark |111&gt;
q.h(2)
toffoli_decomposed(q, 0, 1, 2)
q.h(2)

# Diffusion: H → X → decomposed Toffoli → X → H
for qubit in range(3):
    q.h(qubit)
    q.x(qubit)
q.h(2)
toffoli_decomposed(q, 0, 1, 2)
q.h(2)
for qubit in range(3):
    q.x(qubit)
    q.h(qubit)

samples = q.sample(25)
counts = samples if isinstance(samples, dict) else Counter(map(str, samples))
dominant = max(counts, key=counts.get)

print("Measurement Distribution:")
print(dict(counts))
print("\nDominant State:", dominant)
print("Target State: |111&gt;")</code></pre></div>
<div class="qubit-section"><h2>Expected output</h2><pre class="hdqs-output"><code>Measurement Distribution:
{'111': 23, '001': 1, '110': 1}

Dominant State: 111
Target State: |111&gt;</code></pre><p>These counts are measurement frequencies from 25 shots: 111 appears 23 times, 001 appears once, and 110 appears once. Total = 25 shots.</p></div>
<div class="qubit-section"><h2>Explain the output</h2><div class="gate-comparison"><div><strong>Measured state</strong><strong>Count</strong><strong>What it shows</strong></div><div><span>111</span><span>23</span><span>The target marked by the oracle</span></div><div><span>001</span><span>1</span><span>An unmarked result in this sample</span></div><div><span>110</span><span>1</span><span>An unmarked result in this sample</span></div></div><p>111 appears 23 times, while 001 and 110 each appear once. Therefore 111 is the dominant measured state and the target selected by the oracle. Its observed frequency is <strong>23/25 = 92%</strong>. This is the result of these 25 shots, not a universal theoretical probability.</p></div>
<div class="qubit-section"><h2>Grover vs other algorithms</h2><div class="comparison-grid"><div><strong>Deutsch</strong><span>Is the function constant or balanced?</span></div><div><strong>Deutsch–Jozsa</strong><span>Is the multi-input function constant or balanced?</span></div><div><strong>Bernstein–Vazirani</strong><span>What is the hidden string?</span></div><div><strong>Simon</strong><span>What is the hidden periodicity or secret?</span></div><div><strong>Grover</strong><span>Where is the target?</span></div></div></div>
<aside class="key-idea"><span class="card-label">Key Takeaway</span><p>Grover's Algorithm uses an oracle to phase-mark |111&gt; and a diffusion operator to amplify its amplitude. Across these 25 shots, 111 is the dominant measurement result.</p></aside></section>`;
  return `<section class="qubit-lesson algorithm-lesson">
    <div class="qubit-section"><h2>What problem does it explore?</h2><p>${topic.goal}</p></div>
    <div class="qubit-section"><h2>A beginner-friendly outline</h2><ol>${topic.steps.map((step) => `<li>${step}</li>`).join('')}</ol></div>
    <div class="qubit-section"><h2>What to expect</h2><p>${topic.result}</p></div>
    <aside class="key-idea"><span class="card-label">Coming next</span><p>This page introduces the algorithm's purpose and flow. Verified implementation examples will be added later from the quantum_prg.zip files.</p></aside>
  </section>`;
}

function loadAlgorithmTopic(topicIndex, updateHash = true) {
  state.activeChapter = 4;
  state.activeAlgorithmTopic = Math.max(0, Math.min(algorithmTopics.length - 1, topicIndex));
  state.algorithmsExpanded = true;
  const topic = algorithmTopics[state.activeAlgorithmTopic];
  const isLast = state.activeAlgorithmTopic === algorithmTopics.length - 1;
  if (updateHash) window.location.hash = `algorithm-${state.activeAlgorithmTopic + 1}`;
  $('#lesson-number').textContent = '05';
  $('#lesson-category').textContent = 'QUANTUM ALGORITHMS';
  $('#lesson-title').textContent = topic.title;
  $('#lesson-intro').textContent = topic.intro;
  $('#lesson-type').textContent = chapters[4].type;
  $('#next-number').textContent = isLast ? '06' : `05.${state.activeAlgorithmTopic + 2}`;
  $('#next-title').textContent = isLast ? chapters[5].title : algorithmTopics[state.activeAlgorithmTopic + 1].title;
  $('#next-time').textContent = isLast ? chapters[5].time : '8 min read';
  $('#previous-title').textContent = state.activeAlgorithmTopic ? algorithmTopics[state.activeAlgorithmTopic - 1].title : circuitsAndGatesTopics[circuitsAndGatesTopics.length - 1].title;
  $('#footer-next-title').textContent = isLast ? chapters[5].title : algorithmTopics[state.activeAlgorithmTopic + 1].title;
  $('#previous-button').disabled = false;
  $('#next-button').disabled = false;
  $('#next-button small').textContent = isLast ? 'Next chapter' : 'Next topic';
  $('#lesson-body').innerHTML = algorithmLessonTemplate(topic);
  $('#mobile-breadcrumb').innerHTML = `Chapter 05 <span>/</span> ${topic.title}`;
  $('#doc-breadcrumb').innerHTML = `Quantum Algorithms <span>/</span> ${topic.title}`;
  renderSidebar();
  renderContents();
  wireInteractions(4);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.innerWidth <= 900) $('#sidebar').classList.remove('open');
}

function simulationLessonTemplate(topic) {
  return `<section class="qubit-lesson simulation-lesson">${topic.body}<aside class="key-idea"><span class="card-label">Key takeaway</span><p>A simulator makes a circuit's mathematical predictions visible. Use state inspection to understand amplitudes, then use sampling to understand the measurements an experiment can return.</p></aside></section>`;
}

function loadSimulationTopic(topicIndex, updateHash = true) {
  state.activeChapter = 5;
  state.activeSimulationTopic = Math.max(0, Math.min(simulationTopics.length - 1, topicIndex));
  state.simulationExpanded = true;
  const topic = simulationTopics[state.activeSimulationTopic];
  const isLast = state.activeSimulationTopic === simulationTopics.length - 1;
  if (updateHash) window.location.hash = `simulation-${state.activeSimulationTopic + 1}`;
  $('#lesson-number').textContent = '06';
  $('#lesson-category').textContent = 'QUANTUM SIMULATION';
  $('#lesson-title').textContent = topic.title;
  $('#lesson-intro').textContent = topic.intro;
  $('#lesson-type').textContent = chapters[5].type;
  $('#next-number').textContent = isLast ? '07' : `06.${state.activeSimulationTopic + 2}`;
  $('#next-title').textContent = isLast ? chapters[6].title : simulationTopics[state.activeSimulationTopic + 1].title;
  $('#next-time').textContent = isLast ? chapters[6].time : '8 min read';
  $('#previous-title').textContent = state.activeSimulationTopic ? simulationTopics[state.activeSimulationTopic - 1].title : algorithmTopics[algorithmTopics.length - 1].title;
  $('#footer-next-title').textContent = isLast ? chapters[6].title : simulationTopics[state.activeSimulationTopic + 1].title;
  $('#previous-button').disabled = false;
  $('#next-button').disabled = false;
  $('#next-button small').textContent = isLast ? 'Next chapter' : 'Next topic';
  $('#lesson-body').innerHTML = simulationLessonTemplate(topic);
  $('#mobile-breadcrumb').innerHTML = `Chapter 06 <span>/</span> ${topic.title}`;
  $('#doc-breadcrumb').innerHTML = `Quantum Simulation <span>/</span> ${topic.title}`;
  renderSidebar();
  renderContents();
  wireInteractions(5);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.innerWidth <= 900) $('#sidebar').classList.remove('open');
}

function frameworkLessonTemplate(topic) {
  return `<section class="qubit-lesson frameworks-lesson">${topic.body}</section>`;
}

function loadFrameworkTopic(topicIndex, updateHash = true) {
  state.activeChapter = 6;
  state.activeFrameworkTopic = Math.max(0, Math.min(frameworkTopics.length - 1, topicIndex));
  state.frameworksExpanded = true;
  const topic = frameworkTopics[state.activeFrameworkTopic];
  const isLast = state.activeFrameworkTopic === frameworkTopics.length - 1;
  if (updateHash) window.location.hash = `framework-${state.activeFrameworkTopic + 1}`;
  $('#lesson-number').textContent = '07';
  $('#lesson-category').textContent = 'QUANTUM FRAMEWORKS';
  $('#lesson-title').textContent = topic.title;
  $('#lesson-intro').textContent = topic.intro;
  $('#lesson-type').textContent = chapters[6].type;
  $('#next-number').textContent = isLast ? '08' : `07.${state.activeFrameworkTopic + 2}`;
  $('#next-title').textContent = isLast ? chapters[7].title : frameworkTopics[state.activeFrameworkTopic + 1].title;
  $('#next-time').textContent = isLast ? chapters[7].time : '8 min read';
  $('#previous-title').textContent = state.activeFrameworkTopic ? frameworkTopics[state.activeFrameworkTopic - 1].title : simulationTopics[simulationTopics.length - 1].title;
  $('#footer-next-title').textContent = isLast ? chapters[7].title : frameworkTopics[state.activeFrameworkTopic + 1].title;
  $('#previous-button').disabled = false;
  $('#next-button').disabled = false;
  $('#next-button small').textContent = isLast ? 'Next chapter' : 'Next topic';
  $('#lesson-body').innerHTML = frameworkLessonTemplate(topic);
  $('#mobile-breadcrumb').innerHTML = `Chapter 07 <span>/</span> ${topic.title}`;
  $('#doc-breadcrumb').innerHTML = `Quantum Frameworks <span>/</span> ${topic.title}`;
  renderSidebar();
  renderContents();
  wireInteractions(6);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.innerWidth <= 900) $('#sidebar').classList.remove('open');
}

function applicationLessonTemplate(topic) {
  return `<section class="qubit-lesson applications-lesson">${topic.body}</section>`;
}

function loadApplicationTopic(topicIndex, updateHash = true) {
  state.activeChapter = 7;
  state.activeApplicationTopic = Math.max(0, Math.min(applicationTopics.length - 1, topicIndex));
  state.applicationsExpanded = true;
  const topic = applicationTopics[state.activeApplicationTopic];
  const isLast = state.activeApplicationTopic === applicationTopics.length - 1;
  if (updateHash) window.location.hash = `application-${state.activeApplicationTopic + 1}`;
  $('#lesson-number').textContent = '08';
  $('#lesson-category').textContent = 'QUANTUM APPLICATIONS';
  $('#lesson-title').textContent = topic.title;
  $('#lesson-intro').textContent = topic.intro;
  $('#lesson-type').textContent = chapters[7].type;
  $('#next-number').textContent = isLast ? '—' : `08.${state.activeApplicationTopic + 2}`;
  $('#next-title').textContent = isLast ? 'Field guide complete' : applicationTopics[state.activeApplicationTopic + 1].title;
  $('#next-time').textContent = isLast ? 'You made it' : '8 min read';
  $('#previous-title').textContent = state.activeApplicationTopic ? applicationTopics[state.activeApplicationTopic - 1].title : frameworkTopics[frameworkTopics.length - 1].title;
  $('#footer-next-title').textContent = isLast ? 'Finish' : applicationTopics[state.activeApplicationTopic + 1].title;
  $('#previous-button').disabled = false;
  $('#next-button').disabled = isLast;
  $('#next-button small').textContent = isLast ? 'Complete' : 'Next topic';
  $('#lesson-body').innerHTML = applicationLessonTemplate(topic);
  $('#mobile-breadcrumb').innerHTML = `Chapter 08 <span>/</span> ${topic.title}`;
  $('#doc-breadcrumb').innerHTML = `Quantum Applications <span>/</span> ${topic.title}`;
  renderSidebar();
  renderContents();
  wireInteractions(7);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.innerWidth <= 900) $('#sidebar').classList.remove('open');
}

function escapeLessonText(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatReferenceText(text) {
  return escapeLessonText(text || '')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function ordered3DExampleMarkup({ number, title, concept, code, output, explanation, links, preview, linkImmediatelyBelowCode = false }) {
  return `<article class="qubit-section notebook-example structured-3d-example" id="3d-example-${number}">
    <h3>${formatReferenceText(title)}</h3>
    <div class="structured-example-step"><h4>Concept</h4><p>${formatReferenceText(concept)}</p></div>
    <div class="structured-example-step"><h4>Original Code · Sia Script</h4><pre class="hdqs-code"><code>${escapeLessonText(code)}</code></pre>${linkImmediatelyBelowCode ? `<div class="structured-example-links">${links.map((link) => `<a class="model-action-link" href="${escapeLessonText(link.href)}" target="_blank" rel="noopener noreferrer">Open ${formatReferenceText(link.filename)} ↗</a>`).join('')}</div>` : ''}</div>
    <div class="structured-example-step"><h4>Output</h4>${output ? `<pre class="hdqs-output"><code>${escapeLessonText(output)}</code></pre>` : `<p>${formatReferenceText(output)}</p>`}${preview || ''}</div>
    <div class="structured-example-step"><h4>Explanation</h4><p>${formatReferenceText(explanation)}</p></div>
    <div class="structured-example-step structured-example-links"><h4>Link</h4>${links.map((link) => `<a class="model-action-link" href="${escapeLessonText(link.href)}" ${link.download ? 'download' : 'target="_blank" rel="noopener noreferrer"'}>${formatReferenceText(link.label)}</a>`).join('')}</div>
  </article>`;
}

function sia3DModelsLessonMarkup() {
  const examplesByNumber = new Map(siaNotebookExamples.filter((example) => example.number >= 213 && example.number <= 219).map((example) => [example.number, example]));
  const explorerExamples = [
    {
      number: 37,
      title: 'Phasor Visualization',
      concept: 'The 3D helix links circular rotation to sine and cosine projections: turn it to see the circle end-on, sine from the side, and cosine from above.',
      code: 'from sia import hdqs\nhdqs.explore("phasor")',
      output: "'phasor.html'",
      explanation: 'The phasor explorer writes the default phasor page. Its rotating helix makes the relationship between circular motion and the wave projections visible.',
      links: [{ href: 'assets/interactive-quantum/phasor.html', filename: 'phasor.html', label: 'Open phasor.html interactive visualization ↗' }],
      linkImmediatelyBelowCode: true
    },
    {
      number: 40,
      title: 'Qubit Visualization',
      concept: 'Prepare a single qubit with an Ry rotation, then open its explorer to inspect the resulting state and Bloch-sphere views.',
      code: 'from sia import hdqs\nprint(hdqs(1).ry(0, 1.0).explore("my_qubit.html"))\nprint(hdqs(2).h(0).cx(0, 1).explore("my_bell.html"))',
      output: 'my_qubit.html\nmy_bell.html',
      explanation: 'The first call exports the rotated one-qubit state as an interactive explorer.',
      links: [{ href: 'assets/interactive-quantum/my_qubit.html', filename: 'my_qubit.html', label: 'Open my_qubit.html interactive visualization ↗' }],
      linkImmediatelyBelowCode: true
    },
    {
      number: 40,
      title: 'Bell State Visualization',
      concept: 'Prepare a Bell register with a Hadamard gate and a controlled-X, then explore the resulting two-qubit state.',
      code: 'from sia import hdqs\nprint(hdqs(1).ry(0, 1.0).explore("my_qubit.html"))\nprint(hdqs(2).h(0).cx(0, 1).explore("my_bell.html"))',
      output: 'my_qubit.html\nmy_bell.html',
      explanation: 'The second call exports the Bell register’s interactive explorer so its superposition and entanglement can be inspected.',
      links: [{ href: 'assets/interactive-quantum/my_bell.html', filename: 'my_bell.html', label: 'Open my_bell.html interactive visualization ↗' }],
      linkImmediatelyBelowCode: true
    },
    {
      number: 41,
      title: 'Square Wave Visualization',
      concept: 'Phasors rotating at odd multiples of the base frequency add head to tail to form a square wave; the ripple at the jump is the Gibbs phenomenon.',
      code: 'from sia import hdqs\nhdqs.explore("phasor", "square_wave.html", state="square")',
      output: "'square_wave.html'",
      explanation: 'The phasor explorer is initialized in its square-wave state and saved as square_wave.html.',
      links: [{ href: 'assets/interactive-quantum/square_wave.html', filename: 'square_wave.html', label: 'Open square_wave.html interactive visualization ↗' }],
      linkImmediatelyBelowCode: true
    }
  ];
  const explorerSection = `<section class="qubit-section structured-3d-section" aria-labelledby="interactive-3d-visualizations-title">
    <h2 id="interactive-3d-visualizations-title">Interactive 3D Visualizations</h2>
    <p>These original Sia Script explorer pages are self-contained HTML outputs. Open each one to rotate or interact with its visualization.</p>
    ${explorerExamples.map((example) => ordered3DExampleMarkup({ ...example, linkImmediatelyBelowCode: true })).join('')}
  </section>`;

  const modelDetails = {
      213: {
      title: 'Blender / Web Scene',
      concept: 'Export the Bloch-sphere (b), Q-sphere (q), and density-matrix (d) views of a two-qubit circuit as one named-object glTF scene.',
      output: 'The cell writes scene.glb; it does not print a console report.',
      explanation: 'Import scene.glb in Blender using File > Import > glTF 2.0. The notebook notes that the parts are named objects.',
      file: 'scene.glb', format: 'GLB', preview: 'glb'
    },
      214: {
      title: 'OBJ Model Export',
      concept: 'Export a rotated one-qubit Bloch-sphere view in Wavefront OBJ format with a companion material file.',
      explanation: 'Keep bloch.obj and bloch.mtl in the same directory. The OBJ stores the mesh and refers to its MTL for material colors; this MTL has no texture-file references.',
      file: 'bloch.obj', companion: 'bloch.mtl', format: 'OBJ + MTL', preview: 'obj'
    },
      215: {
      title: '3MF Model Export',
      concept: 'Create a colour 3MF of a Bell pair with the requested sphere diameter set to 60 mm.',
      explanation: 'The saved report marks the model watertight, lists its minimum feature and dimensions, and recommends supports for the reported overhangs.',
      file: 'bell.3mf', format: '3MF', preview: '3mf'
    },
      216: {
      title: 'STL Model Export',
      concept: 'Create a fine resin Bloch-sphere print with a 50 mm diameter and no base.',
      explanation: 'The recorded report marks the model watertight and notes that, without a base, the sphere rests on one point and may need supports or glue.',
      file: 'qubit.stl', format: 'STL', preview: 'stl'
    },
      217: {
      title: '3MF Model Export · Q-sphere and Density Terrain',
      concept: 'Export Q-sphere and density-matrix terrain with a 70 mm diameter and 1.6 mm wall thickness.',
      explanation: 'The recorded 3MF report lists a watertight model and recommends supports for its reported overhangs.',
      file: 'terrain.3mf', format: '3MF', preview: '3mf'
    },
      218: {
      title: 'STL Model Export · Low Detail',
      concept: 'Export a low-detail Bloch-sphere STL without labels or the printed report, then inspect selected printability values.',
      explanation: 'The output reports the model dimensions, triangle count, minimum feature size, and watertight status from the register’s stored print report.',
      file: 'quick.stl', format: 'STL', preview: 'stl'
    },
      219: {
      title: '3MF Model Export · Full Report',
      concept: 'Export a 40 mm Bell-pair 3MF without printing its report, then read selected report fields from the register.',
      explanation: 'The report data marks the model watertight and recommends supports. It also records that a small label was omitted because it would not print at the selected wall thickness.',
      file: 'report_demo.3mf', format: '3MF', preview: '3mf'
    }
  };
  const modelExamples = [213, 214, 215, 216, 217, 218, 219].map((number) => {
    const example = examplesByNumber.get(number);
    const detail = modelDetails[number];
    let output = example.output;
    if (number === 213) output = detail.output;
    const preview = detail.preview ? `<div class="model-preview" data-model-preview="${detail.preview}" data-model-url="assets/interactive-3d/models/${detail.file}" ${detail.companion ? `data-material-url="assets/interactive-3d/models/${detail.companion}"` : ''} role="img" aria-label="Interactive preview of ${detail.file}"><span class="model-preview-status" data-model-status>Loading preview…</span></div>` : '';
    const links = [{ href: `assets/interactive-3d/models/${detail.file}`, label: `Download ${detail.file}`, download: true }];
    if (detail.companion) links.push({ href: `assets/interactive-3d/models/${detail.companion}`, label: `Download companion ${detail.companion}`, download: true });
    const explanation = `${example.codeExplanation} ${example.outputExplanation} ${detail.explanation}`;
    return ordered3DExampleMarkup({ number, title: detail.title, concept: detail.concept, code: example.code, output, explanation, links, preview });
  }).join('');
  const exportSection = `<section class="qubit-section structured-3d-section" aria-labelledby="3d-model-export-title">
    <h2 id="3d-model-export-title">3D Model Export and Printing</h2>
    <p>Each export below uses the notebook’s original Sia Script code and configuration. Rotate or zoom any preview with a mouse or touch; use the links to save the original files.</p>
    ${modelExamples}
  </section>`;
  return `<section class="qubit-lesson sia-reference-lesson structured-3d-lesson">${explorerSection}${exportSection}</section>`;
}

const siaGateExampleDiagrams = {
  62: [
    { src: 'images/x_gate.svg', alt: 'X gate circuit diagram', caption: 'X gate: flips the computational basis state.' },
    { src: 'images/y_gate.svg', alt: 'Y gate circuit diagram', caption: 'Y gate: flips the basis state and adds a phase.' },
    { src: 'images/z_gate.svg', alt: 'Z gate circuit diagram', caption: 'Z gate: changes the phase of the |1⟩ component.' },
    { src: 'images/h_gate.svg', alt: 'Hadamard gate circuit diagram', caption: 'Hadamard gate: creates an equal superposition from |0⟩.' }
  ],
  63: [
    { src: 'images/s_gate.svg', alt: 'S gate circuit diagram', caption: 'S gate: applies a quarter-turn phase rotation.' },
    { src: 'images/t_gate.svg', alt: 'T gate circuit diagram', caption: 'T gate: applies a π/4 phase rotation.' }
  ],
  64: [
    { src: 'images/rx_gate.svg', alt: 'RX gate circuit diagram', caption: 'RX gate: rotates a qubit around the x-axis.' },
    { src: 'images/ry_gate.svg', alt: 'RY gate circuit diagram', caption: 'RY gate: rotates a qubit around the y-axis.' },
    { src: 'images/rz_gate.svg', alt: 'RZ gate circuit diagram', caption: 'RZ gate: rotates a qubit around the z-axis.' }
  ],
  66: [
    { src: 'images/cnot_gate.svg', alt: 'CNOT gate circuit diagram', caption: 'CNOT gate: flips the target when the control is |1⟩.' },
    { src: 'images/cz_gate.svg', alt: 'CZ gate circuit diagram', caption: 'CZ gate: changes the phase of the |11⟩ state.' }
  ],
  68: [
    { src: 'images/swap_gate.svg', alt: 'SWAP gate circuit diagram', caption: 'SWAP gate: exchanges the states carried by two qubits.' }
  ]
};

function siaDocLessonMarkup(topic) {
  if (topic.title === '3D Models') return sia3DModelsLessonMarkup();
  const partIntros = topic.notebookParts.map((part) => {
    const intro = part.intro.replace(/^## Part [^\n]+\n+/, '');
    return `<p>${formatReferenceText(intro)}</p>`;
  }).join('');
  const examples = topic.examples.map((example) => {
    const gateDiagrams = (siaGateExampleDiagrams[example.number] || []).map((diagram) => `<figure class="notebook-gate-diagram"><img src="${diagram.src}" alt="${diagram.alt}"><figcaption>${diagram.caption}</figcaption></figure>`).join('');
    return `<section class="qubit-section notebook-example" id="notebook-example-${example.number}">
    <h3>${formatReferenceText(example.title)}</h3>
    ${example.description ? `<p class="notebook-example-note">${formatReferenceText(example.description)}</p>` : ''}
    ${example.pdfContext ? `<p class="notebook-explanation"><strong>PDF concept.</strong> ${formatReferenceText(example.pdfContext)}</p>` : ''}
    <h4>Sia Script</h4>
    ${gateDiagrams ? `<div class="notebook-gate-diagrams" aria-label="Quantum gate diagrams">${gateDiagrams}</div>` : ''}
    <pre class="hdqs-code"><code>${escapeLessonText(example.code)}</code></pre>
    ${example.codeExplanation ? `<p class="notebook-explanation"><strong>Code explanation.</strong> ${formatReferenceText(example.codeExplanation)}</p>` : ''}
    ${example.output ? `<h4>Recorded notebook output</h4><pre class="hdqs-output"><code>${escapeLessonText(example.output)}</code></pre>` : ''}
    ${example.assets.map((asset) => `<figure class="notebook-output-figure"><img src="${escapeLessonText(asset)}" alt="Saved notebook output: ${escapeLessonText(example.title)}"><figcaption>Saved notebook output: ${formatReferenceText(example.title)}.</figcaption></figure>`).join('')}
    ${example.outputExplanation ? `<p class="notebook-explanation"><strong>Output explanation.</strong> ${formatReferenceText(example.outputExplanation)}</p>` : ''}
  </section>`;
  }).join('');
  return `<section class="qubit-lesson sia-reference-lesson">
    <div class="qubit-section"><h2>Concepts and notation</h2><p>${formatReferenceText(topic.theory)}</p>${partIntros}</div>
    <div class="qubit-section"><h2>Documented Sia Script examples</h2>${examples}</div>
  </section>`;
}

let interactive3DModulesPromise;
function initializeInteractive3DModels() {
  const previews = [...document.querySelectorAll('[data-model-preview]')];
  if (!previews.length) return;
  if (window.location.protocol === 'file:') {
    previews.forEach((preview) => {
      preview.classList.add('model-preview-unavailable');
      const status = preview.querySelector('[data-model-status]');
      if (status) status.textContent = 'Interactive 3D previews require a local web server. Run `python -m http.server 8000` in the project folder, then open http://localhost:8000.';
    });
    return;
  }
  if (!interactive3DModulesPromise) {
    interactive3DModulesPromise = Promise.all([
      import('./assets/interactive-3d/vendor/build/three.module.js'),
      import('./assets/interactive-3d/vendor/examples/jsm/controls/OrbitControls.js'),
      import('./assets/interactive-3d/vendor/examples/jsm/loaders/GLTFLoader.js'),
      import('./assets/interactive-3d/vendor/examples/jsm/loaders/MTLLoader.js'),
      import('./assets/interactive-3d/vendor/examples/jsm/loaders/OBJLoader.js'),
      import('./assets/interactive-3d/vendor/examples/jsm/loaders/STLLoader.js'),
      import('./assets/interactive-3d/vendor/examples/jsm/loaders/3MFLoader.js')
    ]).then(([THREE, { OrbitControls }, { GLTFLoader }, { MTLLoader }, { OBJLoader }, { STLLoader }, { ThreeMFLoader }]) => ({ THREE, OrbitControls, GLTFLoader, MTLLoader, OBJLoader, STLLoader, ThreeMFLoader }));
  }
  interactive3DModulesPromise.then(({ THREE, OrbitControls, GLTFLoader, MTLLoader, OBJLoader, STLLoader, ThreeMFLoader }) => {
    previews.forEach((preview) => {
      if (preview.dataset.initialized) return;
      preview.dataset.initialized = 'true';
      const status = preview.querySelector('[data-model-status]');
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      preview.prepend(canvas);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf8fafb);
      const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      scene.add(new THREE.HemisphereLight(0xffffff, 0x7c8790, 2.1));
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(3, 5, 4);
      scene.add(keyLight);
      const controls = new OrbitControls(camera, canvas);
      controls.enableRotate = true;
      controls.enableZoom = true;
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.minDistance = 0.7;
      controls.maxDistance = 12;
      let model;
      const renderFrame = () => {
        if (!canvas.isConnected) {
          controls.dispose();
          renderer.dispose();
          if (model) model.traverse((part) => {
            if (part.geometry) part.geometry.dispose();
            if (Array.isArray(part.material)) part.material.forEach((material) => material.dispose());
            else if (part.material) part.material.dispose();
          });
          return;
        }
        const width = Math.max(preview.clientWidth, 1);
        const height = Math.max(preview.clientHeight, 1);
        if (canvas.width !== Math.round(width * renderer.getPixelRatio()) || canvas.height !== Math.round(height * renderer.getPixelRatio())) {
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(renderFrame);
      };
      const showModel = (object, convertFromZUp = false) => {
        if (convertFromZUp) object.rotation.x = -Math.PI / 2;
        object.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(object);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const largestSide = Math.max(size.x, size.y, size.z) || 1;
        model = new THREE.Group();
        model.add(object);
        const fitScale = 1.8 / largestSide;
        model.scale.setScalar(fitScale);
        // The parent translation is applied after its scale, so scale the
        // source-space center as well or millimetre exports remain off-screen.
        model.position.copy(center).multiplyScalar(-fitScale);
        scene.add(model);
        // Bounds are measured in source units (some exports are millimetres).
        // Scale the radius too, so the camera distance matches the fitted model.
        const radius = (bounds.getBoundingSphere(new THREE.Sphere()).radius || 1) * fitScale;
        const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.12;
        camera.position.set(distance * 0.85, distance * 0.58, distance);
        camera.near = Math.max(distance / 100, 0.001);
        camera.far = distance * 100;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.update();
        if (status) status.remove();
        requestAnimationFrame(renderFrame);
      };
      const url = (path) => new URL(path, document.baseURI).href;
      const failed = (error) => {
        if (status) status.textContent = `Preview could not be loaded: ${error?.message || 'check the model file and browser WebGL support'}`;
        console.error('Interactive 3D model preview failed:', preview.dataset.modelUrl, error);
        renderer.dispose();
      };
      try {
        if (preview.dataset.modelPreview === 'glb') {
          new GLTFLoader().load(url(preview.dataset.modelUrl), (gltf) => showModel(gltf.scene), undefined, failed);
        } else {
          const format = preview.dataset.modelPreview;
          if (format === 'obj') {
            const modelDirectory = url('assets/interactive-3d/models/');
            const materials = new MTLLoader();
            materials.setResourcePath(modelDirectory);
            materials.load(url(preview.dataset.materialUrl), (materialLibrary) => {
              materialLibrary.preload();
              const objects = new OBJLoader();
              objects.setMaterials(materialLibrary);
              objects.load(url(preview.dataset.modelUrl), showModel, undefined, failed);
            }, undefined, failed);
          } else if (format === 'stl') {
            new STLLoader().load(url(preview.dataset.modelUrl), (geometry) => {
              const material = new THREE.MeshStandardMaterial({
                color: 0x66969c,
                roughness: 0.72,
                metalness: 0.04,
                vertexColors: Boolean(geometry.hasColors)
              });
              showModel(new THREE.Mesh(geometry, material), true);
            }, undefined, failed);
          } else if (format === '3mf') {
            new ThreeMFLoader().load(url(preview.dataset.modelUrl), (object) => showModel(object, true), undefined, failed);
          }
        }
      } catch (error) {
        failed(error);
      }
    });
  }).catch((error) => {
    previews.forEach((preview) => {
      const status = preview.querySelector('[data-model-status]');
      if (status) status.textContent = `Preview viewer could not be loaded: ${error?.message || 'check the local viewer assets'}`;
    });
    console.error('Interactive 3D viewer dependencies failed to load:', error);
  });
}

function loadSiaDocTopic(topicIndex, updateHash = true) {
  const topic = siaDocTopics[topicIndex];
  if (!topic) return;
  state.activeDocTopic = topicIndex;
  state.activeDocSectionIndex = topic.sectionIndex;
  state.activeChapter = topic.chapter;
  state.expandedSection = navigationSections[topic.sectionIndex + 2].id;
  if (updateHash) window.location.hash = `sia-doc-${topicIndex + 1}`;
  const previous = siaDocTopics[topicIndex - 1];
  const next = siaDocTopics[topicIndex + 1];
  $('#lesson-number').textContent = String(topic.chapter + 1).padStart(2, '0');
  $('#lesson-category').textContent = topic.category;
  $('#lesson-title').textContent = topic.title;
  $('#lesson-intro').textContent = topic.intro;
  $('#lesson-type').textContent = 'Sia Script · documented examples';
  $('#next-number').textContent = next ? String(next.chapter + 1).padStart(2, '0') : '—';
  $('#next-title').textContent = next ? next.title : 'Curriculum complete';
  $('#next-time').textContent = next ? 'Reference lesson' : 'You made it';
  $('#previous-title').textContent = previous ? previous.title : mathematicsTopics[mathematicsTopics.length - 1].title;
  $('#footer-next-title').textContent = next ? next.title : 'Finish';
  $('#previous-button').disabled = false;
  $('#next-button').disabled = !next;
  $('#next-button small').textContent = 'Next topic';
  $('#lesson-body').innerHTML = siaDocLessonMarkup(topic);
  if (topic.title === 'Simulation Modes') addLessonSupport('simulation-modes');
  if (topic.title === 'The Browser Playground') addLessonSupport('browser-playground');
  if (topic.title === '3D Models') initializeInteractive3DModels();
  $('#mobile-breadcrumb').innerHTML = `Chapter ${String(topic.chapter + 1).padStart(2, '0')} <span>/</span> ${topic.title}`;
  $('#doc-breadcrumb').innerHTML = `${navigationSections[topic.sectionIndex + 2].title} <span>/</span> ${topic.title}`;
  renderSidebar();
  renderContents();
  wireInteractions(topic.chapter);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.innerWidth <= 900) $('#sidebar').classList.remove('open');
}

function completeChapter(index) { if (!state.completed.includes(index)) { state.completed.push(index); localStorage.setItem('learn-quantum-progress', JSON.stringify(state.completed)); renderSidebar(); showToast('Chapter added to your progress'); } }
function loadGatePage(page, updateHash = true) {
  state.activeChapter = 2;
  state.activeGatePage = page;
  state.activeCircuitStudyTopic = -1;
  state.gatesExpanded = true;
  if (updateHash) window.location.hash = `gate-${page}`;
  const position = gatePageOrder.indexOf(page);
  const isIntroduction = page === 'introduction';
  const title = page === 'introduction' ? 'Quantum<br><i>Gates.</i>'
    : page === 'single' ? 'Single-Qubit<br><i>Gates.</i>'
      : page === 'multi' ? 'Multi-Qubit<br><i>Gates.</i>'
        : page === 'universal' ? 'Universal<br><i>Gates.</i>'
          : page === 'circuits' ? 'Gates in<br><i>circuits.</i>'
            : `${gatePageInfo[page][0]}`;
  const intro = page === 'introduction' ? chapters[2].intro
    : page === 'single' ? 'Single-qubit gates transform one qubit at a time.'
      : page === 'multi' ? 'Multi-qubit gates coordinate two or more qubits.'
        : gatePageInfo[page]?.[1] || '';
  const previousTitle = isIntroduction ? 'Basic Circuits'
    : position > 0 ? gatePageInfo[gatePageOrder[position - 1]]?.[0] || 'Quantum Gates'
      : chapters[1].title;
  const nextTitle = isIntroduction ? circuitStudyTopics[0].title
    : position < gatePageOrder.length - 1 ? gatePageInfo[gatePageOrder[position + 1]]?.[0] || 'Quantum Gates'
      : 'Basic Circuits';
  $('#lesson-number').textContent = '03';
  $('#lesson-category').textContent = 'QUANTUM GATES';
  $('#lesson-title').innerHTML = title;
  $('#lesson-intro').textContent = intro;
  $('#lesson-type').textContent = chapters[2].type;
  $('#next-number').textContent = isIntroduction ? '04.03' : position < gatePageOrder.length - 1 ? '03' : '04';
  $('#next-title').textContent = nextTitle;
  $('#next-time').textContent = position < gatePageOrder.length - 1 ? '6 min read' : chapters[3].time;
  $('#previous-title').textContent = previousTitle;
  $('#footer-next-title').textContent = nextTitle;
  $('#previous-button').disabled = false;
  $('#next-button').disabled = false;
  $('#next-button small').textContent = 'Next topic';
  $('#lesson-body').innerHTML = gatePageTemplate(page);
  if (page === 'introduction') addLessonSupport('gate-set');
  $('#mobile-breadcrumb').innerHTML = `Chapter 03 <span>/</span> ${gatePageInfo[page]?.[0] || 'Quantum Gates'}`;
  $('#doc-breadcrumb').innerHTML = `Quantum Gates <span>/</span> ${gatePageInfo[page]?.[0] || 'Introduction'}`;
  renderSidebar();
  renderContents();
  wireInteractions(2);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.innerWidth <= 900) $('#sidebar').classList.remove('open');
}

function loadChapter(index) {
  state.activeDocTopic = -1;
  state.activeDocSectionIndex = -1;
  state.activeChapter = Math.max(0, Math.min(chapters.length - 1, index));
  if (state.activeChapter === 0) return loadTopic(state.activeTopic);
  if (state.activeChapter === 1) return loadMathTopic(0);
  if (state.activeChapter === 3) return loadCircuitTopic(0);
  if (state.activeChapter === 4) return loadAlgorithmTopic(state.activeAlgorithmTopic);
  if (state.activeChapter === 5) return loadSimulationTopic(state.activeSimulationTopic);
  if (state.activeChapter === 6) return loadFrameworkTopic(state.activeFrameworkTopic);
  if (state.activeChapter === 7) return loadApplicationTopic(state.activeApplicationTopic);
  const chapter = chapters[state.activeChapter];
  $('#lesson-number').textContent = String(state.activeChapter + 1).padStart(2, '0');
  $('#lesson-category').textContent = chapter.title.toUpperCase();
  $('#lesson-title').innerHTML = titleMarkup(state.activeChapter);
  $('#lesson-intro').textContent = chapter.intro;
  $('#lesson-type').textContent = chapter.type;
  $('#next-number').textContent = String(state.activeChapter + 2).padStart(2, '0');
  $('#next-title').textContent = chapters[state.activeChapter + 1].title;
  $('#next-time').textContent = chapters[state.activeChapter + 1].time;
  $('#previous-title').textContent = chapters[state.activeChapter - 1]?.title || 'Quantum Fundamentals';
  $('#footer-next-title').textContent = chapters[state.activeChapter + 1].title;
  $('#previous-button').disabled = false;
  $('#next-button').disabled = false;
  $('#next-button small').textContent = 'Next chapter';
  $('#lesson-body').innerHTML = lessonTemplate(state.activeChapter);
  $('#mobile-breadcrumb').innerHTML = `Chapter ${String(state.activeChapter + 1).padStart(2, '0')} <span>/</span> ${chapter.title}`;
  renderSidebar();
  renderContents();
  wireInteractions(state.activeChapter);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.innerWidth <= 900) $('#sidebar').classList.remove('open');
}
function loadTopic(topicIndex, updateHash = true) { state.activeChapter = 0; state.activeTopic = Math.max(0, Math.min(fundamentalsTopics.length - 1, topicIndex)); const topic = fundamentalsTopics[state.activeTopic]; if (updateHash && window.location.hash !== `#basics-${state.activeTopic + 1}`) window.location.hash = `basics-${state.activeTopic + 1}`; $('#lesson-number').textContent = '01'; $('#lesson-category').textContent = state.activeTopic === 0 ? 'QUANTUM FUNDAMENTALS  /  INTRODUCTION' : `QUANTUM FUNDAMENTALS  /  ${topic.title.toUpperCase()}`; $('#lesson-title').innerHTML = state.activeTopic === 0 ? 'Quantum Fundamentals' : state.activeTopic === 3 ? 'Entanglement<br><i>in connection.</i>' : state.activeTopic === 4 ? 'Measurement<br><i>in observation.</i>' : topic.title; $('#lesson-intro').textContent = topic.intro; $('#lesson-type').textContent = topic.type; $('#next-number').textContent = state.activeTopic < fundamentalsTopics.length - 1 ? `01.${state.activeTopic + 2}` : '02'; $('#next-title').textContent = state.activeTopic < fundamentalsTopics.length - 1 ? fundamentalsTopics[state.activeTopic + 1].title : chapters[1].title; $('#next-time').textContent = state.activeTopic < fundamentalsTopics.length - 1 ? fundamentalsTopics[state.activeTopic + 1].time : chapters[1].time; $('#previous-title').textContent = state.activeTopic > 0 ? fundamentalsTopics[state.activeTopic - 1].title : 'Welcome'; $('#footer-next-title').textContent = state.activeTopic < fundamentalsTopics.length - 1 ? fundamentalsTopics[state.activeTopic + 1].title : chapters[1].title; $('#previous-button').disabled = state.activeTopic === 0; $('#next-button').disabled = false; $('#next-button small').textContent = 'Next'; $('#lesson-body').innerHTML = lessonTemplate(0); addLessonSupport(`fundamentals-${state.activeTopic}`); $('#mobile-breadcrumb').innerHTML = `Chapter 01 <span>/</span> ${topic.title}`; $('#doc-breadcrumb').innerHTML = `Quantum Fundamentals <span>/</span> ${topic.title}`; renderSidebar(); renderContents(); wireInteractions(0); window.scrollTo({ top: 0, behavior: 'smooth' }); if (window.innerWidth <= 900) $('#sidebar').classList.remove('open'); }
function loadMathTopic(topicIndex, updateHash = true) {
  if (!Number.isInteger(topicIndex) || topicIndex < 0 || topicIndex >= mathematicsTopics.length) {
    throw new RangeError(`Invalid mathematical topic index: ${topicIndex}`);
  }
  state.activeChapter = 1;
  state.activeMathTopic = topicIndex;
  state.mathematicsExpanded = true;
  const topic = mathematicsTopics[state.activeMathTopic];
  if (updateHash && window.location.hash !== `#math-${topic.slug}`) window.location.hash = `math-${topic.slug}`;
  const firstTopic = state.activeMathTopic === 0;
  const lastTopic = state.activeMathTopic === mathematicsTopics.length - 1;
  $('#lesson-number').textContent = String(state.activeMathTopic + 1).padStart(2, '0');
  $('#lesson-category').textContent = 'MATHEMATICAL FOUNDATIONS';
  $('#lesson-title').textContent = topic.title;
  $('#lesson-intro').textContent = topic.intro;
  $('#lesson-type').textContent = topic.type;
  $('#next-number').textContent = lastTopic ? String(siaDocTopics[0].chapter + 1).padStart(2, '0') : String(state.activeMathTopic + 2).padStart(2, '0');
  $('#next-title').textContent = lastTopic ? siaDocTopics[0].title : mathematicsTopics[state.activeMathTopic + 1].title;
  $('#next-time').textContent = lastTopic ? 'Reference lesson' : mathematicsTopics[state.activeMathTopic + 1].time;
  $('#previous-title').textContent = firstTopic ? 'Start of section' : mathematicsTopics[state.activeMathTopic - 1].title;
  $('#footer-next-title').textContent = lastTopic ? siaDocTopics[0].title : mathematicsTopics[state.activeMathTopic + 1].title;
  $('#previous-button').disabled = firstTopic;
  $('#next-button').disabled = false;
  $('#next-button small').textContent = lastTopic ? 'Next chapter' : 'Next topic';
  $('#lesson-body').innerHTML = state.activeMathTopic === 0
    ? complexNumbersLessonTemplate(topic)
    : state.activeMathTopic === 1
      ? vectorsLessonTemplate(topic)
      : documentedMathLessonTemplate(topic);
  addLessonSupport(`math-${topic.slug}`);
  $('#mobile-breadcrumb').innerHTML = `Chapter 02 <span>/</span> ${topic.title}`;
  $('#doc-breadcrumb').innerHTML = `Mathematical Foundations <span>/</span> ${topic.title}`;
  renderSidebar();
  renderContents();
  wireInteractions(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.innerWidth <= 900) $('#sidebar').classList.remove('open');
}
function titleMarkup(index) { const titles = ['A new way to<br><i>think</i> about information.', 'The grammar of<br><i>possibility.</i>', 'Quantum<br><i>Gates.</i>', 'Turn ideas into<br><i>experiments.</i>', 'Interference with<br><i>intention.</i>', 'Borrow a quantum<br><i>microscope.</i>', 'From theory to<br><i>runnable code.</i>', 'A horizon worth<br><i>exploring.</i>']; return titles[index]; }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.style.display = 'block'; setTimeout(() => toast.style.display = 'none', 2200); }

$('#previous-button').addEventListener('click', () => {
  if (state.activeDocTopic >= 0) {
    if (state.activeDocTopic > 0) loadSiaDocTopic(state.activeDocTopic - 1);
    else {
      state.activeDocTopic = -1;
      state.activeDocSectionIndex = -1;
      loadMathTopic(mathematicsTopics.length - 1);
    }
    return;
  }
  const sequenceIndex = currentCircuitsAndGatesTopic();
  if (sequenceIndex >= 0) {
    if (sequenceIndex === 0) loadGatePage('circuits');
    else loadCircuitsAndGatesTopic(sequenceIndex - 1);
    return;
  }
  if (state.activeChapter === 0) return loadTopic(state.activeTopic - 1);
  if (state.activeChapter === 1) {
    if (state.activeMathTopic > 0) loadMathTopic(state.activeMathTopic - 1);
    return;
  }
  if (state.activeChapter === 2) {
    const position = gatePageOrder.indexOf(state.activeGatePage);
    return position > 0 ? loadGatePage(gatePageOrder[position - 1]) : loadChapter(1);
  }
  if (state.activeChapter === 3) {
    return state.activeCircuitTopic > 0 ? loadCircuitTopic(state.activeCircuitTopic - 1) : loadGatePage('circuits');
  }
  if (state.activeChapter === 4) {
    return state.activeAlgorithmTopic > 0 ? loadAlgorithmTopic(state.activeAlgorithmTopic - 1) : loadCircuitsAndGatesTopic(circuitsAndGatesTopics.length - 1);
  }
  if (state.activeChapter === 5) return state.activeSimulationTopic > 0 ? loadSimulationTopic(state.activeSimulationTopic - 1) : loadAlgorithmTopic(algorithmTopics.length - 1);
  if (state.activeChapter === 6) return state.activeFrameworkTopic > 0 ? loadFrameworkTopic(state.activeFrameworkTopic - 1) : loadSimulationTopic(simulationTopics.length - 1);
  if (state.activeChapter === 7) return state.activeApplicationTopic > 0 ? loadApplicationTopic(state.activeApplicationTopic - 1) : loadFrameworkTopic(frameworkTopics.length - 1);
  loadChapter(state.activeChapter - 1);
});
$('#next-button').addEventListener('click', () => {
  if (state.activeDocTopic >= 0) {
    completeChapter(state.activeChapter);
    if (state.activeDocTopic < siaDocTopics.length - 1) loadSiaDocTopic(state.activeDocTopic + 1);
    return;
  }
  completeChapter(state.activeChapter);
  const sequenceIndex = currentCircuitsAndGatesTopic();
  if (sequenceIndex >= 0) {
    if (sequenceIndex < circuitsAndGatesTopics.length - 1) loadCircuitsAndGatesTopic(sequenceIndex + 1);
    else loadAlgorithmTopic(0);
    return;
  }
  if (state.activeChapter === 0) return state.activeTopic < fundamentalsTopics.length - 1 ? loadTopic(state.activeTopic + 1) : loadChapter(1);
  if (state.activeChapter === 1) {
    if (state.activeMathTopic < mathematicsTopics.length - 1) loadMathTopic(state.activeMathTopic + 1);
    else loadSiaDocTopic(0);
    return;
  }
  if (state.activeChapter === 2) {
    const position = gatePageOrder.indexOf(state.activeGatePage);
    return position < gatePageOrder.length - 1 ? loadGatePage(gatePageOrder[position + 1]) : loadCircuitTopic(0);
  }
  if (state.activeChapter === 3) {
    return state.activeCircuitTopic < circuitTopics.length - 1 ? loadCircuitTopic(state.activeCircuitTopic + 1) : loadAlgorithmTopic(0);
  }
  if (state.activeChapter === 4) return state.activeAlgorithmTopic < algorithmTopics.length - 1 ? loadAlgorithmTopic(state.activeAlgorithmTopic + 1) : loadChapter(5);
  if (state.activeChapter === 5) return state.activeSimulationTopic < simulationTopics.length - 1 ? loadSimulationTopic(state.activeSimulationTopic + 1) : loadChapter(6);
  if (state.activeChapter === 6) return state.activeFrameworkTopic < frameworkTopics.length - 1 ? loadFrameworkTopic(state.activeFrameworkTopic + 1) : loadChapter(7);
  if (state.activeChapter === 7) return state.activeApplicationTopic < applicationTopics.length - 1 ? loadApplicationTopic(state.activeApplicationTopic + 1) : undefined;
  loadChapter(state.activeChapter + 1);
});
$('#collapse-button').addEventListener('click', () => $('#sidebar').classList.toggle('collapsed'));
$('#menu-button').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
document.addEventListener('keydown', (event) => { if (event.key === '/' && document.activeElement.tagName !== 'INPUT') { event.preventDefault(); $('#search-input').focus(); } });
$('#search-input').addEventListener('input', (event) => { const query = event.target.value.toLowerCase().trim(); const results = $('#search-results'); if (!query) { results.hidden = true; return; } const matches = chapters.map((chapter, index) => ({ chapter, index })).filter(({ chapter }) => `${chapter.title} ${chapter.intro} ${chapter.type}`.toLowerCase().includes(query)); results.innerHTML = matches.length ? matches.map(({ chapter, index }) => `<button data-result="${index}"><span>${String(index + 1).padStart(2, '0')}</span><strong>${chapter.title}</strong><small>${chapter.type}</small></button>`).join('') : '<p>No chapters found</p>'; results.hidden = false; results.querySelectorAll('[data-result]').forEach((result) => result.addEventListener('click', () => { loadChapter(Number(result.dataset.result)); results.hidden = true; $('#search-input').value = ''; })); });

function mathTopicFromHash(hash) {
  const legacyRoutes = { '#math-1': 0, '#math-2': 1, '#math-3': 8, '#math-4': 3, '#math-5': 2, '#math-complex': 0, '#math-vectors': 1 };
  if (Object.prototype.hasOwnProperty.call(legacyRoutes, hash)) return legacyRoutes[hash];
  const slugIndex = mathematicsTopics.findIndex((topic) => hash === `#math-${topic.slug}`);
  if (slugIndex >= 0) return slugIndex;
  const numericRoute = /^#math-(?:[6-9]|1[0-3])$/.exec(hash);
  return numericRoute ? Number(hash.slice(6)) - 1 : -1;
}
function loadRouteFromHash(hash) {
  const siaDocRoute = /^#sia-doc-(\d+)$/.exec(hash);
  if (siaDocRoute) {
    const index = Number(siaDocRoute[1]) - 1;
    if (index < 0 || index >= siaDocTopics.length) return false;
    if (state.activeDocTopic !== index) loadSiaDocTopic(index, false);
    return true;
  }
  state.activeDocTopic = -1;
  state.activeDocSectionIndex = -1;
  const basicsRoute = /^#basics-(\d+)$/.exec(hash);
  if (basicsRoute) {
    const index = Number(basicsRoute[1]) - 1;
    if (index < 0 || index >= fundamentalsTopics.length) return false;
    if (state.activeChapter !== 0 || state.activeTopic !== index) loadTopic(index, false);
    return true;
  }
  if (!hash || hash === '#top') { loadTopic(0, false); return true; }
  const mathIndex = mathTopicFromHash(hash);
  if (mathIndex >= 0) {
    if (state.activeChapter !== 1 || state.activeMathTopic !== mathIndex) loadMathTopic(mathIndex, false);
    return true;
  }
  const circuitStudyRoute = /^#circuit-guide-(\d+)$/.exec(hash);
  if (circuitStudyRoute) {
    const index = Number(circuitStudyRoute[1]) - 1;
    if (index < 0 || index >= circuitStudyTopics.length) return false;
    if (state.activeChapter !== 3 || state.activeCircuitStudyTopic !== index) loadCircuitStudyTopic(index, false);
    return true;
  }
  const circuitRoute = /^#circuit-(\d+)$/.exec(hash);
  if (circuitRoute) {
    const index = Number(circuitRoute[1]) - 1;
    if (index < 0 || index >= circuitTopics.length) return false;
    if (state.activeChapter !== 3 || state.activeCircuitStudyTopic >= 0 || state.activeCircuitTopic !== index) loadCircuitTopic(index, false);
    return true;
  }
  if (hash.startsWith('#gate-')) {
    const page = hash.slice(6);
    if (!gatePageOrder.includes(page)) return false;
    if (state.activeChapter !== 2 || state.activeGatePage !== page) loadGatePage(page, false);
    return true;
  }
  const algorithmRoute = /^#algorithm-(\d+)$/.exec(hash);
  if (algorithmRoute) {
    const index = Number(algorithmRoute[1]) - 1;
    if (index < 0 || index >= algorithmTopics.length) return false;
    if (state.activeChapter !== 4 || state.activeAlgorithmTopic !== index) loadAlgorithmTopic(index, false);
    return true;
  }
  const simulationRoute = /^#simulation-(\d+)$/.exec(hash);
  if (simulationRoute) {
    const index = Number(simulationRoute[1]) - 1;
    if (index < 0 || index >= simulationTopics.length) return false;
    if (state.activeChapter !== 5 || state.activeSimulationTopic !== index) loadSimulationTopic(index, false);
    return true;
  }
  const frameworkRoute = /^#framework-(\d+)$/.exec(hash);
  if (frameworkRoute) {
    const index = Number(frameworkRoute[1]) - 1;
    if (index < 0 || index >= frameworkTopics.length) return false;
    if (state.activeChapter !== 6 || state.activeFrameworkTopic !== index) loadFrameworkTopic(index, false);
    return true;
  }
  const applicationRoute = /^#application-(\d+)$/.exec(hash);
  if (applicationRoute) {
    const index = Number(applicationRoute[1]) - 1;
    if (index < 0 || index >= applicationTopics.length) return false;
    if (state.activeChapter !== 7 || state.activeApplicationTopic !== index) loadApplicationTopic(index, false);
    return true;
  }
  return false;
}

if (!loadRouteFromHash(window.location.hash)) loadChapter(0);
window.addEventListener('hashchange', () => loadRouteFromHash(window.location.hash));
