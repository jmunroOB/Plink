import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="bg-gray-900 text-gray-300 py-10 mt-12">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact and Info Column */}
                <div>
                    <h3 className="text-2xl font-bold text-white mb-4">Plink</h3>
                    <p className="text-sm mb-4">Connecting unique locations with creative vision.</p>
                    <div className="space-y-2">
                        <div className="flex items-center text-sm">
                            <Phone size={16} className="mr-2 text-gray-500" />
                            <span>07414 702134</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <Mail size={16} className="mr-2 text-gray-500" />
                            <span>info@plink.com</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <MapPin size={16} className="mr-2 text-gray-500" />
                            <span>Elgin, Scotland, UK</span>
                        </div>
                    </div>
                </div>
                {/* Legal, Support, and Connect Column */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-8 md:mt-0">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Terms & Conditions</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Cancellation Policy</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
                        <p className="text-sm">Follow us on social media for updates and new locations!</p>
                        {/* Social media icons would go here */}
                    </div>
                </div>
            </div>
            <div className="mt-10 text-center text-sm text-gray-500 border-t border-gray-700 pt-6">
                <p>&copy; {currentYear} Plink. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
