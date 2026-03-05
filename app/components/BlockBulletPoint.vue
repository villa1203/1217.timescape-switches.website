<template>
	<section class="v-block block-bullet-point app-grid app-grid--align-start" >

    <div class="app-grid app-grid--align-start app-grid--justify-center">
      <header class="app-grid__col-4">
        <div class="app-grid app-grid--align-start app-grid--justify-center app-rm-child-margin">
          <h2>Research</h2>
        </div>
      </header>

      <div class="app-grid__col-7">
        <div class="app-grid app-grid--align-start">
          <div class="block-bullet-point__coll">
            <div>
              <div class="block-bullet-point__coll__title">Workshop</div>
              <div>Workshops are a key part of the studio’s practice, creating spaces for experimentation and collective exploration. They allow ideas to be tested through discussion, prototyping, and collaboration with students, professionals, and institutions. These moments of exchange often become a starting point for new research directions and future projects.</div>
            </div>
            <div>
              <div class="block-bullet-point__coll__title">Publication</div>
              <div>Publications document and share the studio’s research. Through essays, research papers, and visual materials, they allow ideas to circulate beyond the studio and contribute to broader discussions in design. Writing and publishing also provide a way to reflect critically on design practices.</div>
            </div>
          </div>
          <div class="block-bullet-point__coll">
            <div>
              <div class="block-bullet-point__coll__title">Venture Design</div>
              <div>Venture design allows the studio to develop projects that move from research to real-world applications. It explores how design ideas can evolve into tools, systems, or initiatives with practical impact. This approach allows design to move beyond speculation and engage directly with implementation and long-term development.</div>
            </div>
            <div>
              <div class="block-bullet-point__coll__title">Speculative Design</div>
              <div>Speculative design enables the studio to explore alternative futures and question existing systems. Through conceptual projects and prototypes, it opens space for reflection on how design can shape emerging technological and social conditions.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

	</section>
</template>

<style scoped lang="scss">
.block-bullet-point {
  box-sizing: border-box;
  width: 100%;
  min-height: calc(100vh - 20rem);
  display: flex;
  justify-content: center;
  align-items: center;
}

.block-bullet-point__coll {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

.block-bullet-point__coll__title {
  font-weight: bold;
  padding-bottom: 1rem;
}
</style>
