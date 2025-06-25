'use client'

import { LucideFacebook, LucideInstagram, LucideTwitter, LucideLinkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-blue-50 to-[#041f79] text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Main Footer */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Aza 3D Learning</h3>
            <p className="text-gray-300 mb-4">
              Learn and create amazing 3D designs with our interactive platform.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <LucideFacebook className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <LucideInstagram className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <LucideTwitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <LucideLinkedin className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Community
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <p className="text-gray-300 mb-4">
              Subscribe to our newsletter for updates and tutorials.
            </p>
            <form className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 bg-gray-800 rounded-lg text-white placeholder-gray-400"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-300">
              © {new Date().getFullYear()} Aza 3D Learning. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                Security
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
