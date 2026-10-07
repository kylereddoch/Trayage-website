import { layout } from '../layout.mjs';
import { supportFaqs } from '../pages.mjs';

export default function (data) {
  return layout({ ...data, body: data.content, faqs: data.path === 'support/' ? supportFaqs(data.base, data.site, data.releases) : undefined });
}
