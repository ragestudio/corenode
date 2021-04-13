import React from 'react'
import os from 'os'
import { Row, Col, Statistic, Descriptions } from 'antd'

export default class OSMonitor extends React.Component {
  state = {
    memoryMonitor: {},
    cpuMonitor: {},
    intervalFreq: 1000
  }

  componentDidMount() {
    const usage = require('os-usage')

    const cpuMonitor = new usage.CpuMonitor()
    const memoryMonitor = new usage.MemMonitor()

    cpuMonitor.on('cpuUsage', (data) => {
      const stateUpdate = { cpuMonitor: data }
      this.setState(stateUpdate)
    })

    // memoryMonitor.on('memUsage', (data) => {
    //   const stateUpdate = { memoryMonitor: data }
    //   this.setState(stateUpdate)
    // })

    setInterval(() => {
      const stateUpdate = { freemem: os.freemem() }
      this.setState(stateUpdate)
    }, this.state.intervalFreq)
  }

  render() {
    const { freemem, cpuMonitor } = this.state

    const totalmem = os.totalmem()
    const cpus = os.cpus()
    const arch = os.arch()

    return (
      <div>
        <div style={{ marginBottom: "45px" }}>
          <Row>
            <Col span={12}>
              <Statistic title='OS' value={`${os.type()}, ${os.platform()}, ${os.release()}`} />
            </Col>
          </Row>
        </div>

        <div style={{ marginBottom: "45px" }}>
          <Row>
            <Col span={4}>
              <Statistic title='Arch' value={`${arch}`} />
            </Col>
            <Col span={4}>
              <Statistic title='Cores' value={`${cpus.length}`} />
            </Col>
            <Col span={4}>
              <Statistic title='Total memory' value={`${totalmem / 1024 / 1024}M`} />
            </Col>
          </Row>
        </div>

        <div style={{ marginBottom: "45px" }}>
          <Row>
            <Col span={4}>
              <Statistic title='Available memory' value={`${(freemem / 1024 / 1024).toFixed(2)}M`} />
            </Col>
            <Col span={4}>
              <Statistic title='CPU Usage (sys)' value={`${cpuMonitor.sys}`} />
            </Col>
            <Col span={4}>
              <Statistic title='CPU Usage (user)' value={`${cpuMonitor.user}`} />
            </Col>
          </Row>
        </div>

        <div>
          <Descriptions title='CPU INFO' bordered column={2}>
            {cpus.map((cpu, idx) =>
              <Descriptions.Item key={idx} label='CPU'>{cpu.model}</Descriptions.Item>
            )}
          </Descriptions>
        </div>
      </div>
    )
  }
}