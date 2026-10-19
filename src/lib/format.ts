const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const pad = (n: number) => String(n).padStart(2, '0')

export const fd = (d: number | string | Date): string => {
  const x = new Date(d)
  return `${x.getDate()} ${MON[x.getMonth()]} ${x.getFullYear()}`
}

export const fdt = (d: number | string | Date): string => {
  const x = new Date(d)
  return `${fd(x)} ${pad(x.getHours())}:${pad(x.getMinutes())}`
}

export const iso = (d: number | string | Date): string => {
  const x = new Date(d)
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}

export const rp = (n: number): string =>
  'IDR ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const rn = (n: number): string => Number(n || 0).toLocaleString('id-ID')
