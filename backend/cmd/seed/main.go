// Seed script
// Populates the database with realistic demo data:
//   1 pantheon, 5 staff, 30 rooms (floors 1-3), ~15 guests, 20+ tasks, finance records.
package main

import (
	"context"
	"fmt"
	"math/rand"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

var rnd = rand.New(rand.NewSource(time.Now().UnixNano()))

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://pansion:***@127.0.0.1:5432/pansion?sslmode=disable"
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		fmt.Println("connect:", err)
		os.Exit(1)
	}
	defer pool.Close()

	fmt.Println("→ Connecting...")
	if err := pool.Ping(ctx); err != nil {
		fmt.Println("ping:", err)
		os.Exit(1)
	}

	// ---- Check if already seeded ----
	var userCount int
	_ = pool.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&userCount)
	if userCount > 1 {
		fmt.Printf("→ DB already has %d users. Delete first? (run: TRUNCATE users,rooms,guests,pensions RESTART IDENTITY CASCADE)\n", userCount)
		fmt.Println("→ Skipping seed.")
		os.Exit(0)
	}

	fmt.Println("→ Seeding demo data...")

	// === 1. Pantheon ===
	pensionID := uuid.New().String()
	mustExec(ctx, pool, `INSERT INTO pensions (id, name, address) VALUES ($1,$2,$3)`,
		pensionID, "Родные Пенаты — Крым", "Республика Крым, г. Ялта, ул. Морская, 12")
	fmt.Println("  ✓ Pantheon created")

	// === 2. Staff ===
	staff := []struct {
		email, pass, first, last, role, phone string
	}{
		{"ivanov", "1234", "Иван", "Иванов", "owner", "+79001001001"},
		{"petrova", "1234", "Мария", "Петрова", "manager", "+79001001002"},
		{"smirnov", "1234", "Алексей", "Смирнов", "doctor", "+79001001003"},
		{"sidorova", "1234", "Анна", "Сидорова", "maid", "+79001001004"},
		{"kozlova", "1234", "Елена", "Козлова", "maid", "+79001001005"},
	}

	for _, s := range staff {
		hash, _ := bcrypt.GenerateFromPassword([]byte(s.pass), bcrypt.DefaultCost)
		mustExec(ctx, pool,
			`INSERT INTO users (pension_id, email, phone, password_hash, first_name, last_name, role, status) VALUES ($1,$2,$3,$4,$5,$6,$7,'active')`,
			pensionID, s.email+"@pansion.local", s.phone, string(hash), s.first, s.last, s.role,
		)
	}
	fmt.Println("  ✓ 5 staff users")

	// === 3. Rooms ===
	// Floor 1: 101-110 (standard), Floor 2: 201-210 (lux), Floor 3: 301-310 (suite)
	statuses := []string{"vacant", "vacant", "booked", "occupied", "occupied", "checking_out_today", "vacant"}
	roomIDs := make(map[string]string) // "101" → uuid

	for floor := 1; floor <= 3; floor++ {
		for n := 1; n <= 10; n++ {
			num := fmt.Sprintf("%d%02d", floor, n)
			status := statuses[rnd.Intn(len(statuses))]
			id := uuid.New().String()
			roomIDs[num] = id
			mustExec(ctx, pool,
				"INSERT INTO rooms (id, pension_id, number, floor, status) VALUES ($1,$2,$3,$4,$5)",
				id, pensionID, num, floor, status,
			)
		}
	}
	fmt.Println("  ✓ 30 rooms (3 floors × 10)")

	// === 4. Guests ===
	guests := []struct {
		fn, ln, mn, diet, notes string
	}{
		{"Николай", "Кузнецов", "Петрович", "Стол №5", "Гипертония, утром принимает лекарства"},
		{"Татьяна", "Соколова", "Андреевна", "Без сахара", "Диабет 2 типа, диета строгая"},
		{"Александр", "Попов", "Игоревич", "Обычный", ""},
		{"Елена", "Новикова", "Николаевна", "Стол №9", "После операции, лёгкая пища"},
		{"Михаил", "Федоров", "Александрович", "Обычный", ""},
		{"Ольга", "Морозова", "Дмитриевна", "Без глютена", "Аллергия на орехи"},
		{"Сергей", "Волков", "Сергеевич", "Обычный", ""},
		{"Наталья", "Лебедева", "Павловна", "Стол №5", ""},
		{"Андрей", "Козлов", "Владимирович", "Обычный", "Любит тишину, номер окном в сад"},
		{"Ирина", "Смирнова", "Олеговна", "Без сахара", ""},
		{"Дмитрий", "Орлов", "Васильевич", "Обычный", ""},
		{"Марина", "Белова", "Ивановна", "Стол №9", "Пожилая, нужна помощь с передвижением"},
		{"Евгений", "Комаров", "Николаевич", "Обычный", ""},
		{"Светлана", "Тихонова", "Александровна", "Без глютена", ""},
		{"Виктор", "Егоров", "Петрович", "Стол №5", ""},
	}

	// Place guests in occupied rooms
	var occupiedRooms []string
	for _, id := range roomIDs {
		if len(occupiedRooms) >= len(guests) {
			break
		}
		// Check if room status is occupied
		var st string
		_ = pool.QueryRow(ctx, "SELECT status FROM rooms WHERE id=$1", id).Scan(&st)
		if st == "occupied" || st == "booked" {
			occupiedRooms = append(occupiedRooms, id)
		}
	}

	for i, g := range guests {
		var roomID interface{}
		if i < len(occupiedRooms) {
			roomID = occupiedRooms[i]
		} else {
			roomID = nil
		}
		var bd time.Time
		if rnd.Intn(2) == 0 {
			bd = time.Date(1940+rnd.Intn(30), time.January, 1+rnd.Intn(28), 0, 0, 0, 0, time.UTC)
		}
		status := "active"
		if roomID == nil {
			status = "queue"
		}
		mustExec(ctx, pool,
			`INSERT INTO guests (room_id, first_name, last_name, middle_name, birth_date, diet_type, character_notes, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
			roomID, g.fn, g.ln, g.mn, bd, g.diet, g.notes, status,
		)
	}
	fmt.Printf("  ✓ %d guests\n", len(guests))

	// === 5. Maid tasks ===
	taskTypes := []string{"linen_change", "wet_cleaning", "watering_flowers"}
	totalTasks := 0

	for _, roomID := range occupiedRooms {
		num := rnd.Intn(3) + 1 // 1-3 tasks per room
		for t := 0; t < num; t++ {
			tt := taskTypes[rnd.Intn(len(taskTypes))]
			status := "pending"
			if rnd.Intn(4) == 0 {
				status = "completed"
			} else if rnd.Intn(5) == 0 {
				status = "in_progress"
			}
			mustExec(ctx, pool,
				"INSERT INTO maid_tasks (room_id, task_type, status) VALUES ($1,$2,$3)",
				roomID, tt, status,
			)
			totalTasks++
		}
	}
	fmt.Printf("  ✓ %d maid tasks\n", totalTasks)

	// === 6. Medical prescriptions (for doctor smirnov) ===
	fmt.Println("  ✓ Medical module (placeholder — add via UI later)")

	// === 7. Finance ===
	categories := []string{"rent", "food", "food", "chemicals", "salary", "salary", "utilities", "maintenance"}
	descs := map[string][]string{
		"rent":         {"Проживание Кузнецов Н.П.", "Проживание Соколова Т.А.", "Проживание Попов А.И."},
		"food":         {"Закупка продуктов на неделю", "Поставка диетического питания", "Фрукты и овощи"},
		"chemicals":    {"Бытовая химия для уборки", "Дезинфицирующие средства"},
		"salary":       {"Зарплата горничной Сидорова", "Зарплата горничной Козлова", "Зарплата управляющей Петрова"},
		"utilities":    {"Электричество — май 2026", "Водоснабжение — май 2026", "Интернет и телефон"},
		"maintenance": {"Ремонт санузла №205", "Замена замка №103", "Покраска коридора 3 этаж"},
	}

	for i := 0; i < 20; i++ {
		cat := categories[rnd.Intn(len(categories))]
		desc := descs[cat][rnd.Intn(len(descs[cat]))]
		amount := float64(rnd.Intn(500)+50) * 10 // 500 — 50000
		typ := "income"
		if cat != "rent" {
			typ = "expense"
			if rnd.Intn(5) == 0 {
				typ = "income"
			}
		}
		date := time.Now().AddDate(0, 0, -rnd.Intn(30))
		mustExec(ctx, pool,
			`INSERT INTO transactions (pension_id, type, amount, category, description, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
			pensionID, typ, amount, cat, desc, date,
		)
	}
	fmt.Println("  ✓ 20 finance records")

	// === 8. Relatives for some guests ===
	fmt.Println("  ✓ Relatives (placeholder — add via UI later)")

	fmt.Println("\n═══ SEED COMPLETE ═══")
	fmt.Println("Login: ivanov@pansion.local / 1234  (owner)")
	fmt.Println("       petrova@pansion.local / 1234  (manager)")
	fmt.Println("       smirnov@pansion.local / 1234  (doctor)")
	fmt.Println("       sidorova@pansion.local / 1234 (maid)")
	fmt.Println("       kozlova@pansion.local / 1234  (maid)")
}

func mustExec(ctx context.Context, pool *pgxpool.Pool, sql string, args ...interface{}) {
	_, err := pool.Exec(ctx, sql, args...)
	if err != nil {
		fmt.Printf("  SQL ERROR: %v\n  Query: %s\n", err, sql)
	}
}
