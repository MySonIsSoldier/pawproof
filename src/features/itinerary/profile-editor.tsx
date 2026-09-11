import type { TripInput } from "../../domain/policies/types";
import { equipmentOptions } from "../../domain/policies/types";
import { Icon } from "../../components/icon";
import { Input } from "../../components/ui/input";
import { DatePicker } from "../../components/ui/date-picker";
import { TimePicker } from "../../components/ui/time-picker";
export function ProfileEditor({
  trip,
  update,
  busy,
}: {
  trip: TripInput;
  update: (trip: TripInput) => void;
  busy: boolean;
}) {
  return (
    <fieldset className="profile-panel" disabled={busy}>
      <legend className="sr-only">반려견과 여행 정보</legend>
      <div className="panel-title">
        <span className="round-icon">
          <Icon name="paw" />
        </span>
        <div>
          <h2>누구와 떠나나요?</h2>
          <p>함께 가는 반려견을 알려주세요.</p>
        </div>
        <span className="counter">{trip.pets.length}마리</span>
      </div>
      <div className="pet-list">
        {trip.pets.map((pet, index) => (
          <div className="pet-form" key={index}>
            <div className="pet-form-heading">
              <strong>반려견 {index + 1}</strong>
              {trip.pets.length > 1 && (
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`반려견 ${index + 1} 삭제`}
                  onClick={() =>
                    update({
                      ...trip,
                      pets: trip.pets.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            <div className="pet-fields">
              <label>
                이름
                <Input
                  aria-label={`반려견 ${index + 1} 이름`}
                  value={pet.name}
                  maxLength={20}
                  onChange={(e) =>
                    update({
                      ...trip,
                      pets: trip.pets.map((p, i) =>
                        i === index ? { ...p, name: e.target.value } : p,
                      ),
                    })
                  }
                  placeholder="예: 두부"
                />
              </label>
              <label>
                견종
                <Input
                  aria-label={`반려견 ${index + 1} 견종`}
                  value={pet.breed}
                  maxLength={40}
                  onChange={(e) =>
                    update({
                      ...trip,
                      pets: trip.pets.map((p, i) =>
                        i === index ? { ...p, breed: e.target.value } : p,
                      ),
                    })
                  }
                  placeholder="믹스·모름도 가능"
                />
              </label>
              <label>
                체중 <span className="muted">kg</span>
                <Input
                  aria-label={`반려견 ${index + 1} 체중`}
                  type="number"
                  min="0.1"
                  max="120"
                  step="0.1"
                  value={pet.weight || ""}
                  onChange={(e) =>
                    update({
                      ...trip,
                      pets: trip.pets.map((p, i) =>
                        i === index
                          ? { ...p, weight: Number(e.target.value) }
                          : p,
                      ),
                    })
                  }
                />
              </label>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="add-pet"
        disabled={trip.pets.length >= 5}
        onClick={() =>
          update({
            ...trip,
            pets: [...trip.pets, { name: "", breed: "모름", weight: 5 }],
          })
        }
      >
        <Icon name="plus" size={16} /> 함께 가는 반려견 추가
      </button>
      <div className="field-divider" />
      <div className="date-fields">
        <div className="ui-field">
          <span>여행 날짜</span>
          <DatePicker
            label="여행 날짜"
            value={trip.date}
            disabled={busy}
            onChange={(date) => update({ ...trip, date })}
          />
        </div>
        <div className="ui-field">
          <span>첫 장소 도착</span>
          <TimePicker
            label="첫 장소 도착"
            value={trip.startTime}
            disabled={busy}
            onChange={(startTime) => update({ ...trip, startTime })}
          />
        </div>
      </div>
      <p className="field-caption">
        한국 시간 기준 · 집에서 첫 장소까지의 이동은 별도예요.
      </p>
      <div className="equipment-heading">
        <strong>미리 준비한 것</strong>
        <span>선택한 항목만 준비 완료로 반영해요.</span>
      </div>
      <div className="equipment-chips">
        {equipmentOptions.map((item) => (
          <label
            key={item}
            className={trip.equipment.includes(item) ? "selected" : ""}
          >
            <input
              type="checkbox"
              checked={trip.equipment.includes(item)}
              onChange={() =>
                update({
                  ...trip,
                  equipment: trip.equipment.includes(item)
                    ? trip.equipment.filter((value) => value !== item)
                    : [...trip.equipment, item],
                })
              }
            />
            <Icon
              name={trip.equipment.includes(item) ? "check" : "plus"}
              size={14}
            />
            {item}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
