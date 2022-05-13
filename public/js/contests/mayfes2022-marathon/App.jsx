const React = require('react')
const contest = require('../../../../contests/mayfes2022-marathon.js')
const TWEEN = require('@tweenjs/tween.js')
const { FontAwesomeIcon } = require('@fortawesome/react-fontawesome')
const {
  faFastBackward,
  faPlay,
  faPause,
} = require('@fortawesome/free-solid-svg-icons')

const getColor = (i) => {
  switch (i) {
    case 1:
      return '#dc3545'
    case 2:
      return '#ffc107'
    case 3:
      return '#198754'
    case 4:
      return '#0d6efd'
  }
}

class App extends React.Component {
  constructor (state) {
    super(state)
    const data = JSON.parse(document.querySelector('meta[name="data"]').getAttribute('content'))

    const input = data.turns[0].input
    const output = data.turns[0].stdout
    const {perm,cost, n,k } = contest.parseInput(input)


    this.svgRef = React.createRef()
    
    let operations
    let m
    try{
      operations = contest.parseOutput(output, n)
      m = parseInt(output.toString().split('\n')[0])
    }catch(e){
      alert(e)
      operations = []
      m = 0
    }

    this.displayWidth = 1000
    this.displayHeight = 400
    this.itemOffsetWidth = (this.displayWidth / 2
      + 2 // Half of gap
      - n * 12)
    this.itemOffsetHeight = (this.displayHeight / 2 - 10)

    console.log('Input:')
    console.log(input)
    console.log('Output:')
    console.log(output,)

    this.state = {
      playing: false,
      duration: 1000,
      perm,
      cost,
      n,
      k,
      operations,
      m,
      initialPerm: _.cloneDeep(perm),
      operatingIndex: 0,
    }

    
    this.handleFastBackward = this.handleFastBackward.bind(this)
    this.handlePlay = this.handlePlay.bind(this)
    this.handlePause = this.handlePause.bind(this)
    this.handleSelect = this.handleSelect.bind(this)
    this.forwardStep = this.forwardStep.bind(this)
  }

  componentDidMount () {
    this.resetPerm()
    const cb = () => {
      TWEEN.update()
      requestAnimationFrame(cb)
    }
    requestAnimationFrame(cb)
    // FIXME: destroy the callback on unmount

    document.addEventListener('keydown', (ev) => {
      if (this.state.operatingIndex !== this.state.operations.length) {
        if (this.state.playing) {
          this.handlePause()
        } else {
          this.handlePlay()
        }
        ev.preventDefault()
      }
    })
  }

  resetPerm () {
    this.svgRef.current.innerHTML = ''
    this.els = this.state.perm.map((x,index) => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      el.setAttribute('width', '20px')
      el.setAttribute('height', '20px')
      el.setAttribute('fill', '#000000')
      el.setAttribute('x', `${this.itemOffsetWidth + index * 24}px`)
      el.setAttribute('y', `${this.itemOffsetHeight}px`)
      el.innerHTML = x

      this.svgRef.current.appendChild(el)
      return el
  })
  this.kView = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  this.kView.setAttribute('x',`${this.itemOffsetWidth - 30}px`)
  this.kView.setAttribute('y', `${this.itemOffsetHeight - 60}px`)
  this.kView.setAttribute('font-size','40px')
  this.kView.innerHTML = `k: ${this.state.k}`
  this.svgRef.current.appendChild(this.kView)
  this.costLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  this.costLabel.setAttribute('x',`${this.itemOffsetWidth - 30}px`)
  this.costLabel.setAttribute('y', `${this.itemOffsetHeight - 14}px`)
  this.costLabel.setAttribute('font-size','10px')
  this.costLabel.innerHTML = 'cost:'
  this.svgRef.current.appendChild(this.costLabel)
  this.costSoFarLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  this.costSoFarLabel.setAttribute('x',`${this.itemOffsetWidth - 30}px`)
  this.costSoFarLabel.setAttribute('y', `${this.itemOffsetHeight + 48}px`)
  this.costSoFarLabel.setAttribute('font-size','40px')
  this.costSoFarLabel.innerHTML = 'total cost:'
  this.svgRef.current.appendChild(this.costSoFarLabel)
  this.costSoFar = 0
  this.costSoFarView = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  this.costSoFarView.setAttribute('x',`${this.itemOffsetWidth +180 }px`)
  this.costSoFarView.setAttribute('y', `${this.itemOffsetHeight + 48}px`)
  this.costSoFarView.setAttribute('font-size','40px')
  this.costSoFarView.innerHTML = this.costSoFar
  this.svgRef.current.appendChild(this.costSoFarView)
  this.inversionCountLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  this.inversionCountLabel.setAttribute('x',`${this.itemOffsetWidth - 30}px`)
  this.inversionCountLabel.setAttribute('y', `${this.itemOffsetHeight + 96}px`)
  this.inversionCountLabel.setAttribute('font-size','40px')
  this.inversionCountLabel.innerHTML = 'inversion count:'
  this.svgRef.current.appendChild(this.inversionCountLabel)
  this.inversionCount = contest.inverseCount(this.state.perm,this.state.n)
  this.inversionCountView = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  this.inversionCountView.setAttribute('x',`${this.itemOffsetWidth + 280 }px`)
  this.inversionCountView.setAttribute('y', `${this.itemOffsetHeight + 96}px`)
  this.inversionCountView.setAttribute('font-size','40px')
  this.inversionCountView.innerHTML = this.inversionCount
  this.svgRef.current.appendChild(this.inversionCountView)
  this.scoreLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  this.scoreLabel.setAttribute('x',`${this.itemOffsetWidth - 30}px`)
  this.scoreLabel.setAttribute('y', `${this.itemOffsetHeight + 144}px`)
  this.scoreLabel.setAttribute('font-size','40px')
  this.scoreLabel.innerHTML = 'score:'
  this.svgRef.current.appendChild(this.scoreLabel)
  this.score = Math.floor(10 ** 5 * this.state.cost.reduce(function(sum, element){
    return sum + element
  }, 0) ** 2 / (1+(this.costSoFar + this.inversionCount * 200)** 2))
  this.scoreView = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  this.scoreView.setAttribute('x',`${this.itemOffsetWidth +100 }px`)
  this.scoreView.setAttribute('y', `${this.itemOffsetHeight + 144}px`)
  this.scoreView.setAttribute('font-size','40px')
  this.scoreView.innerHTML = this.score
  this.svgRef.current.appendChild(this.scoreView)
  this.costels = this.state.cost.map((x,index) => {
    const costel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    costel.setAttribute('width', '20px')
    costel.setAttribute('height', '20px')
    costel.setAttribute('fill','black')
    costel.setAttribute('x', `${this.itemOffsetWidth + index * 24}px`)
    costel.setAttribute('y', `${this.itemOffsetHeight - 14}px`)
    costel.setAttribute('font-size','10px')
    costel.innerHTML = x
    
    this.svgRef.current.appendChild(costel)
    return costel
  })
}

  forwardStep () {
    const { left, right } = this.state.operations[this.state.operatingIndex]
    const n = this.state.n
    const wait = this.state.duration
    const duration = wait * 0.85
    const animateObject = (el, from, to) => {
      const cb = (o) => {
        if (o.x != null) {
          el.setAttribute('x', `${this.itemOffsetWidth + o.x * 24}px`)
        }
      }
      if (duration > 1) {
        new TWEEN.Tween(from).to(to, duration).easing(TWEEN.Easing.Cubic.InOut).onUpdate(cb).start()
      } else {
        cb(to)
      }
    }
      for (let i = 0; i < this.state.n; i++){
        this.els[i].setAttribute('fill','black')
        this.costels[i].setAttribute('fill','black')
      }
      const temp = [...this.els]
      const permtemp = [...(this.state.perm)]
      const permtemp0 = permtemp.slice(0, left)
      const permtemp1 = permtemp.slice(left, right)
      const permtemp2 = permtemp.slice(right)
      let permtemp1sorted = [...permtemp1]
      let col = 'red'
      const inv = contest.inverseCount(permtemp1, right - left)
      if (inv <= this.state.k){
        permtemp1sorted.sort((a,b) => a-b)
        col = '#00ff00'
      }
      let dictpermtemp1sorted = {}
      for (let i = left; i < right; i++){
        dictpermtemp1sorted[permtemp1sorted[i - left]]=i
        temp[i].setAttribute('fill',col)
        this.costels[i].setAttribute('fill','#ff00ff')
      }
      for (let i = left; i < right; i++){
        animateObject(temp[i], { x: i }, { x: dictpermtemp1sorted[permtemp[i]] })
      }
      for (let i = left; i < right; i++){
        this.els[dictpermtemp1sorted[permtemp[i]]]=temp[i]
        this.els[dictpermtemp1sorted[permtemp[i]]].setAttribute('x',`${this.itemOffsetWidth + dictpermtemp1sorted[permtemp[i]] * 24}px`)
      }
      this.state.perm=permtemp0.concat(permtemp1sorted).concat(permtemp2)
      this.costSoFar += this.state.cost.slice(left,right).reduce(function(sum, element){
        return sum + element
      }, 0)
      this.inversionCount = contest.inverseCount(this.state.perm,this.state.n)
      this.score = Math.floor(10 ** 5 * this.state.cost.reduce(function(sum, element){
        return sum + element
      }, 0) ** 2 / (1+(this.costSoFar + this.inversionCount * 200)** 2))
      this.costSoFarView.innerHTML = this.costSoFar
      this.scoreView.innerHTML = this.score
      this.inversionCountView.innerHTML = this.inversionCount
      
      
    if (this.state.playing && this.state.operatingIndex + 1 < this.state.m) {
      this.pending = setTimeout(this.forwardStep, wait)
    } else {
      this.pending = setTimeout(()=>{
        for (let i = 0; i < this.state.n; i++){
          this.els[i].setAttribute('fill','black')
          this.costels[i].setAttribute('fill','black')
        }
      }, wait)
      this.setState({playing: false})
    }
    this.setState({
      operatingIndex: this.state.operatingIndex + 1,
    })
    
  }

  

  handleFastBackward () {
    const { initialPerm } = this.state

    this.state.playing = false
    TWEEN.removeAll()

    this.setState(() => ({ perm: _.cloneDeep(initialPerm), operatingIndex: 0 }), () => {
      this.resetPerm()
    })
  }

  handlePlay () {
    this.setState({
      playing: true,
    }, () => {
      this.forwardStep()
    })
  }

  handlePause () {
    this.setState({
      playing: false,
    })
  }

  handleSelect (event) {
    this.setState({ duration: parseInt(event.target.value) })
  }

  render () {
    const { playing, operations, operatingIndex } = this.state
    return (
      <div className="wrapper">
        <div className="viewbox">
          <div className="viewbox-inner">
            <svg
              style={{
                display: 'block',
                width: `${this.displayWidth}px`,
                height: `${this.displayHeight}px`,
                margin: '0 auto',
                boxSizing: 'content-box',
                position: 'relative',
              }}
              viewBox={`0 0 ${this.displayWidth} ${this.displayHeight}`}
              ref={this.svgRef}
            >
            </svg>
          </div>
        </div>
        <div
          className="score">
          {`Time: ${operatingIndex}`}
        </div>
        <div className="toolbar">
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={this.handleFastBackward}
              disabled={playing || operatingIndex === 0}
              title="Fast Backward"
            >
              <FontAwesomeIcon icon={faFastBackward} fixedWidth/>
            </button>
            {playing
              ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={this.handlePause}
                  title="Pause"
                >
                  <FontAwesomeIcon icon={faPause} fixedWidth/>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={this.handlePlay}
                  title="Play"
                  disabled={operatingIndex === operations.length}
                >
                  <FontAwesomeIcon icon={faPlay} fixedWidth/>
                </button>
              )}
          </div>
          <select className="custom-select" value={this.state.value} onChange={this.handleSelect}>
            <option value="1000" selected>1x</option>
            <option value="500">2x</option>
            <option value="333">3x</option>
            <option value="250">4x</option>
            <option value="125">8x</option>
            <option value="50">20x</option>
            <option value="33">30x</option>
            <option value="16">60x</option>
            <option value="1">MAX (up to 1000x)</option>
          </select>
        </div>
      </div>
    )
  }
}

module.exports = App
