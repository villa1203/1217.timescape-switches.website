<template>
  <main class="shabbat-page">
    <h1>Shabbat Countdown</h1>

    <div class="countdown-container">
      <!-- Default: Jerusalem -->
      <ShabbatCountdown />
    </div>

  </main>
</template>

<style scoped>
.shabbat-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 2rem;
}

.countdown-container {
  margin-bottom: 3rem;
}

.info-section {
  background: #f9fafb;
  padding: 2rem;
  border-radius: 8px;
}

.info-section h2 {
  margin-top: 0;
}

.info-section h3 {
  margin-top: 2rem;
}

.info-section code {
  background: #e5e7eb;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: monospace;
}

.info-section a {
  color: #667eea;
  text-decoration: underline;
}

.info-section ul {
  list-style: none;
  padding-left: 0;
}

.info-section li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.info-section li:last-child {
  border-bottom: none;
}

details {
  margin-top: 1rem;
}

summary {
  cursor: pointer;
  font-weight: 600;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  user-select: none;
}

summary:hover {
  background: #f3f4f6;
}

@media (max-width: 640px) {
  .shabbat-page {
    padding: 1rem;
  }

  h1 {
    font-size: 2rem;
  }

  .info-section {
    padding: 1.5rem;
  }
}
</style>
