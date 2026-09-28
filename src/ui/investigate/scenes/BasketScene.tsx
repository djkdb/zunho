import { OBJECTS } from '../../../game/data/objects';
import { useT } from '../../hooks';
import { SceneFrame } from '../SceneFrame';

export function BasketScene() {
  const t = useT();
  return (
    <SceneFrame
      id="basket"
      title={t(OBJECTS.basket.name)}
      caption={<p>{t({ en: 'You smooth out one of the crumpled drafts.', ko: '구겨진 초안 하나를 펴 본다.' })}</p>}
    >
      <div className="paper paper--crumpled">
        <p className="paper-hand">
          {t({
            en: '…no. Too easy.\nIf I write the numbers down,\nI will stop remembering them.\nLet the books keep them.',
            ko: '…아니. 너무 쉽다.\n숫자를 적어 두면\n기억하기를 멈출 것이다.\n책들이 간직하게 하자.',
          })}
        </p>
        <svg className="paper-scribble" viewBox="0 0 200 40" aria-hidden="true">
          <path
            d="M8 22 q10 -14 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 M12 28 l170 -14 M14 12 l168 18"
            stroke="#3b2c1f"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </SceneFrame>
  );
}
