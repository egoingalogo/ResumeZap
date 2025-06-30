Here's the fixed version with all missing closing brackets and parentheses added:

```typescript
import React, { useState, useEffect } from 'react';
// ... (previous imports remain the same)

const SkillGapAnalysis: React.FC = () => {
  // ... (component code remains the same until the missing brackets)

                                      {resource.url && (
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-purple-600 dark:text-purple-400 hover:underline text-xs">Access Resource <ExternalLink className="h-3 w-3" /></a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Certifications */}
                            {recommendation.certifications.length > 0 && (
                              <div className="mt-6">
                                <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                                  <Award className="h-4 w-4" />
                                  <span>Relevant Certifications</span>
                                </h5>
                                <div className="grid md:grid-cols-2 gap-3">
                                  {recommendation.certifications.map((cert, certIndex) => (
                                    <div key={certIndex} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                      <h6 className="font-medium text-blue-900 dark:text-blue-400">{cert.name}</h6>
                                      <div className="flex items-center space-x-4 mt-2 text-sm text-blue-700 dark:text-blue-500">
                                        <span>{cert.provider}</span>
                                        <span>{cert.timeToComplete}</span>
                                        <span>{cert.cost}</span>
                                      </div>
                                      {cert.validity && (
                                        <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Validity: {cert.validity}</p>
                                      )}
                                      {cert.industryRecognition && (
                                        <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Recognition: {cert.industryRecognition}</p>
                                      )}
                                      {cert.url && (
                                        <a href={cert.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-purple-600 dark:text-purple-400 hover:underline text-xs">View Certification <ExternalLink className="h-3 w-3" /></a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ... (rest of the component remains the same) ... */}

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillGapAnalysis;
```