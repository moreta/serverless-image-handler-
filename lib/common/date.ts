import { format } from "date-fns"

export const formatNow = () => {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
}
