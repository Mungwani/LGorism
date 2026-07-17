import { useMemo, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import "./JungmoSettlement.css";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function calcSettlement(items, includedParticipants, discountAmount) {
  const raw = {};
  const breakdown = {};
  includedParticipants.forEach((p) => {
    raw[p.id] = 0;
    breakdown[p.id] = [];
  });
  const warnings = [];
  let itemsTotal = 0;

  items.forEach((item) => {
    const amount = Number(item.amount) || 0;
    if (amount <= 0) return;
    itemsTotal += amount;

    const selectedIds = includedParticipants
      .map((p) => p.id)
      .filter((id) => item.selected[id]);

    if (selectedIds.length === 0) {
      warnings.push(`"${item.label || "이름 없는 항목"}" (${amount.toLocaleString()}원)에 참여자가 없어요`);
      return;
    }

    const share = amount / selectedIds.length;
    selectedIds.forEach((id) => {
      raw[id] += share;
      breakdown[id].push({ label: item.label || "항목", amount: share });
    });
  });

  // 비음주 할인 — 안 마시는 사람은 -할인액, 그 차액은 마시는 사람들에게 고르게 재분배
  const drinkers = includedParticipants.filter((p) => p.drinks);
  const nonDrinkers = includedParticipants.filter((p) => !p.drinks);
  let totalDiscountApplied = 0;
  nonDrinkers.forEach((p) => {
    const applied = Math.min(discountAmount, raw[p.id]);
    if (applied > 0) {
      raw[p.id] -= applied;
      breakdown[p.id].push({ label: "비음주 할인", amount: -applied });
      totalDiscountApplied += applied;
    }
  });
  if (totalDiscountApplied > 0) {
    if (drinkers.length > 0) {
      const perDrinkerAdd = totalDiscountApplied / drinkers.length;
      drinkers.forEach((p) => {
        raw[p.id] += perDrinkerAdd;
        breakdown[p.id].push({ label: "비음주 할인 분담", amount: perDrinkerAdd });
      });
    } else {
      warnings.push("비음주 할인을 나눠 낼 음주자가 없어서 총 합계가 그만큼 줄어들어요");
    }
  }

  // 반올림 보정 — 1의 자리 오차를 최고액 참여자에게 몰아서 합계를 정확히 맞춤
  const rawTotalSum = Object.values(raw).reduce((s, v) => s + v, 0);
  const rounded = Object.fromEntries(
    includedParticipants.map((p) => [p.id, Math.round(raw[p.id])])
  );
  const sumRounded = Object.values(rounded).reduce((s, v) => s + v, 0);
  const diff = Math.round(rawTotalSum) - sumRounded;
  if (diff !== 0) {
    const targetId = [...includedParticipants].sort((a, b) => raw[b.id] - raw[a.id])[0]?.id;
    if (targetId) rounded[targetId] += diff;
  }

  const totalAmount = Object.values(rounded).reduce((s, v) => s + v, 0);

  return { perPerson: rounded, breakdown, totalAmount, itemsTotal, warnings };
}

export default function JungmoSettlementModal({ applications, jungmoTitle, onClose }) {
  const initialParticipants = useMemo(() => {
    const seen = new Set();
    const list = [];
    applications.forEach((app) => {
      const name = app.nickname?.trim();
      if (name && !seen.has(name)) {
        seen.add(name);
        list.push({ id: uid(), name, included: true, drinks: true });
      }
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [participants, setParticipants] = useState(initialParticipants);
  const [newName, setNewName] = useState("");
  const [discountAmount, setDiscountAmount] = useState("10000");
  const [drinkSectionOpen, setDrinkSectionOpen] = useState(false);
  const [items, setItems] = useState([
    {
      id: uid(),
      label: "",
      amount: "",
      selected: Object.fromEntries(initialParticipants.map((p) => [p.id, true])),
    },
  ]);
  const [accountNote, setAccountNote] = useState("");
  const [copied, setCopied] = useState(false);

  function addParticipant() {
    const name = newName.trim();
    if (!name) return;
    const id = uid();
    setParticipants((prev) => [...prev, { id, name, included: true, drinks: true }]);
    setItems((prev) => prev.map((it) => ({ ...it, selected: { ...it.selected, [id]: true } })));
    setNewName("");
  }

  function toggleParticipant(id) {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, included: !p.included } : p)));
  }

  function toggleDrinks(id) {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, drinks: !p.drinks } : p)));
  }

  function removeParticipant(id) {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setItems((prev) =>
      prev.map((it) => {
        const rest = { ...it.selected };
        delete rest[id];
        return { ...it, selected: rest };
      })
    );
  }

  function addItem() {
    const includedIds = participants.filter((p) => p.included).map((p) => p.id);
    setItems((prev) => [
      ...prev,
      { id: uid(), label: "", amount: "", selected: Object.fromEntries(includedIds.map((id) => [id, true])) },
    ]);
  }

  function updateItem(id, fields) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...fields } : it)));
  }

  function toggleItemParticipant(itemId, participantId) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? { ...it, selected: { ...it.selected, [participantId]: !it.selected[participantId] } }
          : it
      )
    );
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  const includedParticipants = participants.filter((p) => p.included);
  const { perPerson, breakdown, totalAmount, warnings } = useMemo(
    () => calcSettlement(items, includedParticipants, Number(discountAmount) || 0),
    [items, includedParticipants, discountAmount]
  );
  const nonDrinkerCount = includedParticipants.filter((p) => !p.drinks).length;

  function buildResultText() {
    const lines = [`🎮 ${jungmoTitle} 정산`, ""];
    includedParticipants.forEach((p) => {
      const total = perPerson[p.id];
      const bd = breakdown[p.id] || [];
      if (total === undefined) return;
      const breakdownStr = bd
        .map((b) => `${b.amount < 0 ? "-" : ""}${Math.round(Math.abs(b.amount)).toLocaleString()}원(${b.label})`)
        .join(" / ");
      lines.push(`${p.name} - ${breakdownStr || "0원"}`);
      lines.push(`= ${total.toLocaleString()}원`);
      lines.push("");
    });
    lines.push(`총 합계: ${totalAmount.toLocaleString()}원`);
    if (accountNote.trim()) {
      lines.push("");
      lines.push(`💳 ${accountNote.trim()}로 입금 부탁드립니다~!`);
    }
    return lines.join("\n");
  }

  async function handleCopy() {
    const text = buildResultText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("복사가 안 될 경우 아래 내용을 직접 복사해주세요", text);
    }
  }

  return (
    <div className="settlement-overlay" onClick={onClose}>
      <div className="settlement-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settlement-header">
          <h4>💰 정산하기</h4>
          <button className="settlement-close" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <div className="settlement-section">
          <p className="settlement-section-title">참여자</p>
          <div className="settlement-participant-list">
            {participants.map((p) => (
              <label key={p.id} className={`settlement-chip ${p.included ? "on" : ""}`}>
                <input type="checkbox" checked={p.included} onChange={() => toggleParticipant(p.id)} />
                {p.name}
                <button
                  type="button"
                  className="settlement-chip-remove"
                  onClick={(e) => { e.preventDefault(); removeParticipant(p.id); }}
                  aria-label={`${p.name} 삭제`}
                >×</button>
              </label>
            ))}
            {participants.length === 0 && <p className="settlement-empty-hint">참여자를 추가해주세요</p>}
          </div>
          <div className="settlement-add-participant">
            <input
              type="text"
              placeholder="신청 안 한 참여자 추가"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addParticipant(); } }}
              maxLength={20}
            />
            <button type="button" onClick={addParticipant}>+ 추가</button>
          </div>
        </div>

        <div className="settlement-section">
          <button
            type="button"
            className="settlement-collapse-header"
            onClick={() => setDrinkSectionOpen((v) => !v)}
          >
            <span className="settlement-section-title">
              🍺 비음주 할인{nonDrinkerCount > 0 && ` (${nonDrinkerCount}명)`}
            </span>
            <FaChevronDown className={`settlement-collapse-chevron ${drinkSectionOpen ? "open" : ""}`} />
          </button>

          {drinkSectionOpen && (
            <>
              <div className="settlement-discount-input standalone">
                <span>1인당 할인 금액</span>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  min={0}
                />
                <span>원</span>
              </div>
              <div className="settlement-participant-list">
                {includedParticipants.map((p) => (
                  <label key={p.id} className={`settlement-chip drink ${!p.drinks ? "on" : ""}`}>
                    <input type="checkbox" checked={!p.drinks} onChange={() => toggleDrinks(p.id)} />
                    {p.name}
                  </label>
                ))}
                {includedParticipants.length === 0 && <p className="settlement-empty-hint">참여자를 먼저 추가해주세요</p>}
              </div>
            </>
          )}
        </div>

        <div className="settlement-section">
          <p className="settlement-section-title">항목</p>
          <div className="settlement-item-list">
            {items.map((item) => (
              <div key={item.id} className="settlement-item">
                <div className="settlement-item-row">
                  <input
                    type="text"
                    placeholder="항목명 (예: 스크린야구)"
                    value={item.label}
                    onChange={(e) => updateItem(item.id, { label: e.target.value })}
                    maxLength={20}
                  />
                  <input
                    type="number"
                    placeholder="금액"
                    value={item.amount}
                    onChange={(e) => updateItem(item.id, { amount: e.target.value })}
                    min={0}
                  />
                  <button type="button" className="settlement-item-remove" onClick={() => removeItem(item.id)}>삭제</button>
                </div>
                <div className="settlement-item-participants">
                  {includedParticipants.map((p) => (
                    <label key={p.id} className={`settlement-mini-chip ${item.selected[p.id] ? "on" : ""}`}>
                      <input
                        type="checkbox"
                        checked={!!item.selected[p.id]}
                        onChange={() => toggleItemParticipant(item.id, p.id)}
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="settlement-add-item" onClick={addItem}>+ 항목 추가</button>
        </div>

        {warnings.length > 0 && (
          <div className="settlement-warnings">
            {warnings.map((w, i) => <p key={i}>⚠️ {w}</p>)}
          </div>
        )}

        <div className="settlement-section">
          <p className="settlement-section-title">결과</p>
          <div className="settlement-result">
            {includedParticipants.map((p) => (
              <div key={p.id} className="settlement-result-row">
                <span>{p.name}{!p.drinks && <em className="settlement-nodrink-tag">비음주</em>}</span>
                <strong>{(perPerson[p.id] || 0).toLocaleString()}원</strong>
              </div>
            ))}
            <div className="settlement-result-row total">
              <span>총 합계</span>
              <strong>{totalAmount.toLocaleString()}원</strong>
            </div>
          </div>
        </div>

        <div className="settlement-cta">
          <input
            type="text"
            className="settlement-account-input"
            placeholder="입금 계좌 안내 (선택, 복사 텍스트 맨 아래 추가됨)"
            value={accountNote}
            onChange={(e) => setAccountNote(e.target.value)}
            maxLength={100}
          />
          <button type="button" className="settlement-copy-btn" onClick={handleCopy}>
            {copied ? "✓ 복사됨!" : "📋 결과 복사하기"}
          </button>
        </div>
      </div>
    </div>
  );
}