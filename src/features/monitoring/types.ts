/** data of a "System metrics" WebSocket frame. Field meanings: Manager README, "Live telemetry". */
export type SystemSnapshot = {
  time: string
  host: {
    cpu_percent: number
    cpu_cores: number
    load: [number, number, number]
    memory_total_bytes: number
    memory_used_bytes: number
    swap_total_bytes: number
    swap_used_bytes: number
    disk_total_bytes: number
    disk_used_bytes: number
    uptime_seconds: number
  }
  manager: {
    memory_bytes: number
    memory_limit_bytes: number
    heap_bytes: number
    goroutines: number
    net_rx_bytes_per_sec: number
    net_tx_bytes_per_sec: number
    uptime_seconds: number
    ws_clients: number
    telemetry_buffered: number
    mqtt_connected: boolean
  }
}

export type Sample = {
  snapshot: SystemSnapshot
  /** epoch ms of SystemSnapshot.time */
  sampledAt: number
  /** epoch ms when the browser received the frame */
  receivedAt: number
}
