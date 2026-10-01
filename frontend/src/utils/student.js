export function normalizeStudentCard(student) {
  return {
    id: student.user_id,
    name: student.name,
    rollNo: student.roll_no,
    year: student.batch_year,
    photo: student.profile_photo,
    quote: student.quote,
    positionTitle: student.position_title,
  };
}

export function normalizeStudentDetail(detail) {
  return {
    id: detail.user_id,
    name: detail.name,
    rollNo: detail.roll_no,
    year: detail.batch_year,
    email: detail.email,
    photo: detail.feature_photo,
    quote: detail.quote,
    tagline: detail.tagline,
    about: detail.about,
    physicsLike: detail.physics_like,
    areaOfInterest: detail.area_of_interest,
    hobbies: detail.hobbies,
    proudOf: detail.proud_of,
    phd: detail.phd,
    academic: detail.academic,
    jobs: detail.jobs,
    linkedin: detail.linkedin,
    instagram: detail.instagram,
    footerQuote: detail.footer_quote,
    positionTitle: detail.position_title,
    additionalPhotos: (detail.additional_photos || []).map((photo) => ({
      src: photo.photo_url,
      caption: photo.caption,
    })),
    coreMemories: (detail.core_memories || []).map((memory) => ({
      id: memory.id,
      title: memory.title,
      text: memory.memory_text,
      photos: (memory.photos || []).map((photo) => photo.photo_url),
    })),
  };
}
