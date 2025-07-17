import lib from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import  'dayjs/locale/pt-BR'


lib.locale('pt-BR')
lib.extend(relativeTime)

export const dayjs = lib
