import { layout } from '../layout.mjs';

export default function (data) {
  return layout({ ...data, body: data.content });
}
